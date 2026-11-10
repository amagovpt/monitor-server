import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import {
  Column,
  DataSource,
  Entity,
  PrimaryGeneratedColumn,
  QueryRunner,
  SelectQueryBuilder,
} from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { AppLoggerService } from '@core/app-logger/app-logger.service';
import { SecurityContext } from 'src/core/authentication/interfaces/types';
import {
  ADMIN_CONTEXT_ID,
  ContextEnum,
  getContextIdByCode,
} from 'src/domains/inventory/context/context.enum';
import { FilterMap, SortingMap } from './base.repository';
import { ContextAwareRepository } from './context-aware.repository';
import { BaseFilter, BaseSort } from '../interfaces/types';

// Real enum: ADMIN = AMS (1, admin context), A = MONITOR (2), B = OBSERVATORY (3).
const CODE = {
  ADMIN: ContextEnum.AMS,
  A: ContextEnum.MONITOR,
  B: ContextEnum.OBSERVATORY,
} as const;
const CTX = {
  ADMIN: ADMIN_CONTEXT_ID,
  A: getContextIdByCode(CODE.A)!,
  B: getContextIdByCode(CODE.B)!,
} as const;

/** 'NOPE' simulates a code that has no id (getContextIdByCode -> undefined). */
const code = (c: keyof typeof CODE | 'NOPE'): ContextEnum =>
  c === 'NOPE' ? ('NOPE' as unknown as ContextEnum) : CODE[c];

// ---------------------------------------------------------------------------
// Test entities + repositories
// ---------------------------------------------------------------------------
@Entity('test_items')
class TestItem {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'text', nullable: true }) name!: string | null;
  @Column({ name: 'website_id', type: 'int' }) websiteId!: number;
}

@Entity('test_children')
class TestChild {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ name: 'item_id', type: 'int' }) itemId!: number;
}

/** Context table sits directly on the main table (no helper table). */
class TestItemRepository extends ContextAwareRepository<TestItem> {
  protected readonly alias = 'item';
  protected readonly filterMap = {} as FilterMap<BaseFilter, TestItem>;
  protected readonly sortMap = {} as SortingMap<BaseSort, TestItem>;

  constructor(dataSource: DataSource, logger: AppLoggerService, config: ConfigService) {
    super(dataSource.getRepository(TestItem), logger, config, {
      mainTable: { table: 'test_items', alias: 'item', pk: 'id', fk: 'id' },
      contextTable: { table: 'test_item_contexts', alias: 'ctx', pk: 'id', fk: 'item_id' },
      hasHelperTable: false,
    });
  }

  qb(): SelectQueryBuilder<TestItem> {
    return this.orm.createQueryBuilder('item');
  }
  applyRules(q: SelectQueryBuilder<TestItem>, c: ContextEnum[] | undefined, sc: SecurityContext) {
    this.applyContextRules(q, c, sc);
  }
  applyCustomRule(q: SelectQueryBuilder<TestItem>, sc: SecurityContext) {
    this.customContextRuleQuery(q, sc);
  }
  callUpsert(ids: number[], c: ContextEnum[] | undefined, sc: SecurityContext) {
    return this.runInTransaction((qr: QueryRunner) => this.upsertContextRules(qr, ids, c, sc));
  }
  callAdd(ids: number[], c?: ContextEnum[], sc?: SecurityContext) {
    return this.runInTransaction((qr: QueryRunner) => this.addContextRules(qr, ids, c, sc));
  }
  callSubstitute(ids: number[], c?: ContextEnum[], sc?: SecurityContext) {
    return this.runInTransaction((qr: QueryRunner) => this.substituteContextRules(qr, ids, c, sc));
  }
}

/** Main table is test_children; context lives on the helper table test_items. */
class TestChildRepository extends ContextAwareRepository<TestChild> {
  protected readonly alias = 'child';
  protected readonly filterMap = {} as FilterMap<BaseFilter, TestChild>;
  protected readonly sortMap = {} as SortingMap<BaseSort, TestChild>;

  constructor(dataSource: DataSource, logger: AppLoggerService, config: ConfigService) {
    super(dataSource.getRepository(TestChild), logger, config, {
      mainTable: { table: 'test_children', alias: 'child', pk: 'id', fk: 'item_id' },
      helperTable: { table: 'test_items', alias: 'item', pk: 'id', fk: 'id' },
      contextTable: { table: 'test_item_contexts', alias: 'ctx', pk: 'id', fk: 'item_id' },
      hasHelperTable: true,
    });
  }

  qb(): SelectQueryBuilder<TestChild> {
    return this.orm.createQueryBuilder('child');
  }
  applyRules(q: SelectQueryBuilder<TestChild>, c: ContextEnum[] | undefined, sc: SecurityContext) {
    this.applyContextRules(q, c, sc);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const securityContext = (userId: number, contextId: number | undefined) =>
  ({
    user: { id: userId, context: contextId === undefined ? undefined : { id: contextId } },
  }) as unknown as SecurityContext;

describe('ContextAwareRepository Integration (Testcontainers + Postgres)', () => {
  let container: StartedTestContainer;
  let dataSource: DataSource;
  let repo: TestItemRepository;
  let childRepo: TestChildRepository;

  const logger = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  } as unknown as AppLoggerService;
  const config = { get: jest.fn((_key: string, def: unknown) => def) } as unknown as ConfigService;

  async function insertItems(websiteIds: number[]): Promise<number[]> {
    const rows = await dataSource.query(
      `INSERT INTO test_items (name, website_id)
       SELECT 'item', w FROM unnest($1::int[]) AS w
       RETURNING id`,
      [websiteIds],
    );
    return rows.map((r: { id: number }) => r.id);
  }

  async function associate(itemId: number, contextIds: number[]): Promise<void> {
    for (const ctxId of contextIds) {
      await dataSource.query(
        'INSERT INTO test_item_contexts (item_id, context_id) VALUES ($1, $2)',
        [itemId, ctxId],
      );
    }
  }

  async function associations(): Promise<Array<[number, number]>> {
    const rows = await dataSource.query(
      'SELECT item_id, context_id FROM test_item_contexts ORDER BY item_id, context_id',
    );
    return rows.map((r: { item_id: number; context_id: number }) => [r.item_id, r.context_id]);
  }

  const ids = (entities: Array<{ id: number }>) =>
    [...new Set(entities.map((e) => e.id))].sort((a, b) => a - b);

  beforeAll(async () => {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
        POSTGRES_DB: 'test',
      })
      .withExposedPorts(5432)
      // Postgres logs this twice (init server + real server)
      .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/, 2))
      .start();

    dataSource = new DataSource({
      type: 'postgres',
      host: container.getHost(),
      port: container.getMappedPort(5432),
      username: 'test',
      password: 'test',
      database: 'test',
      entities: [TestItem, TestChild],
      synchronize: false,
    });
    await dataSource.initialize();

    await dataSource.query(`
      CREATE TABLE test_items (
        id         SERIAL PRIMARY KEY,
        name       TEXT,
        website_id INT NOT NULL
      );
      CREATE TABLE test_children (
        id      SERIAL PRIMARY KEY,
        item_id INT NOT NULL
      );
      CREATE TABLE test_item_contexts (
        item_id    INT NOT NULL,
        context_id INT NOT NULL,
        PRIMARY KEY (item_id, context_id)
      );
      CREATE TABLE users_websites (
        user_id    INT NOT NULL,
        website_id INT NOT NULL
      );
      CREATE TABLE team_member (
        id      SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        team_id INT NOT NULL
      );
      CREATE TABLE team_websites (
        id         SERIAL PRIMARY KEY,
        website_id INT NOT NULL,
        team_id    INT NOT NULL
      );
    `);

    repo = new TestItemRepository(dataSource, logger, config);
    childRepo = new TestChildRepository(dataSource, logger, config);
  }, 120000);

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (container) await container.stop();
  });

  beforeEach(async () => {
    await dataSource.query(
      `TRUNCATE test_item_contexts, test_children, test_items,
                users_websites, team_member, team_websites
       RESTART IDENTITY`,
    );
  });

  // -------------------------------------------------------------------------
  describe('upsertContextRules', () => {
    it('inserts the cross product of relation ids and explicit contexts', async () => {
      const [a, b] = await insertItems([1, 1]);

      await repo.callUpsert([a, b], [code('A'), code('B')], securityContext(1, CTX.ADMIN));

      expect(await associations()).toEqual([
        [a, CTX.A],
        [a, CTX.B],
        [b, CTX.A],
        [b, CTX.B],
      ]);
    });

    it.each([
      ['undefined', undefined],
      ['an empty array', [] as ContextEnum[]],
    ])("falls back to the user's own context when contexts is %s", async (_label, contexts) => {
      const [a] = await insertItems([1]);

      await repo.callUpsert([a], contexts, securityContext(1, CTX.B));

      expect(await associations()).toEqual([[a, CTX.B]]);
    });

    it('is idempotent (ON CONFLICT DO NOTHING)', async () => {
      const [a] = await insertItems([1]);

      await repo.callUpsert([a], [code('A')], securityContext(1, CTX.ADMIN));
      await repo.callUpsert([a], [code('A')], securityContext(1, CTX.ADMIN));

      expect(await associations()).toEqual([[a, CTX.A]]);
    });

    it('does nothing when relationIds is empty', async () => {
      await repo.callUpsert([], [code('A')], securityContext(1, CTX.A));
      expect(await associations()).toEqual([]);
    });

    it('ignores unknown context codes and skips the insert if none are valid', async () => {
      const [a] = await insertItems([1]);

      await repo.callUpsert([a], [code('A'), code('NOPE')], securityContext(1, CTX.ADMIN));
      expect(await associations()).toEqual([[a, CTX.A]]);

      await dataSource.query('TRUNCATE test_item_contexts');
      await repo.callUpsert([a], [code('NOPE')], securityContext(1, CTX.ADMIN));
      expect(await associations()).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  describe('addContextRules', () => {
    it('dedupes ids and filters out invalid ones (<=0, non-integer)', async () => {
      const [a] = await insertItems([1]);

      await repo.callAdd([a, a, 0, -5, 1.5, NaN], [code('A')]);

      expect(await associations()).toEqual([[a, CTX.A]]);
    });

    it('uses the security context when contexts is undefined', async () => {
      const [a] = await insertItems([1]);

      await repo.callAdd([a], undefined, securityContext(1, CTX.B));

      expect(await associations()).toEqual([[a, CTX.B]]);
    });

    it('inserts nothing when contexts is undefined and there is no security context', async () => {
      const [a] = await insertItems([1]);

      await repo.callAdd([a]);

      expect(await associations()).toEqual([]);
    });

    it('inserts nothing when contexts is an empty array', async () => {
      const [a] = await insertItems([1]);

      await repo.callAdd([a], [], securityContext(1, CTX.B));

      expect(await associations()).toEqual([]);
    });

    it('keeps existing associations and is idempotent', async () => {
      const [a] = await insertItems([1]);
      await associate(a, [CTX.A]);

      await repo.callAdd([a], [code('A'), code('B')]);
      await repo.callAdd([a], [code('A'), code('B')]);

      expect(await associations()).toEqual([
        [a, CTX.A],
        [a, CTX.B],
      ]);
    });

    it('processes more than one batch (1000 ids per batch)', async () => {
      const rows = await dataSource.query(
        `INSERT INTO test_items (name, website_id)
         SELECT 'bulk', 1 FROM generate_series(1, 2500) RETURNING id`,
      );
      const allIds: number[] = rows.map((r: { id: number }) => r.id);

      await repo.callAdd(allIds, [code('A')]);

      const [{ count }] = await dataSource.query(
        'SELECT COUNT(*)::int AS count FROM test_item_contexts WHERE context_id = $1',
        [CTX.A],
      );
      expect(count).toBe(2500);
    });
  });

  // -------------------------------------------------------------------------
  describe('substituteContextRules', () => {
    it('prunes contexts that are no longer wanted, keeps shared ones and adds new ones', async () => {
      const [a] = await insertItems([1]);
      await associate(a, [CTX.A, CTX.B]);

      await repo.callSubstitute([a], [code('B'), code('ADMIN')]);

      expect(await associations()).toEqual([
        [a, CTX.ADMIN],
        [a, CTX.B],
      ]);
    });

    it('does not touch items that are not in the relationIds list', async () => {
      const [a, b] = await insertItems([1, 1]);
      await associate(a, [CTX.A]);
      await associate(b, [CTX.A]);

      await repo.callSubstitute([a], [code('B')]);

      expect(await associations()).toEqual([
        [a, CTX.B],
        [b, CTX.A],
      ]);
    });

    it('removes every association when contexts is an empty array', async () => {
      const [a, b] = await insertItems([1, 1]);
      await associate(a, [CTX.A, CTX.B]);
      await associate(b, [CTX.A]);

      await repo.callSubstitute([a], []);

      expect(await associations()).toEqual([[b, CTX.A]]);
    });

    it('clears associations when contexts is undefined and there is no security context', async () => {
      const [a] = await insertItems([1]);
      await associate(a, [CTX.A]);

      await repo.callSubstitute([a]);

      expect(await associations()).toEqual([]);
    });

    it('substitutes with the security context when contexts is undefined', async () => {
      const [a] = await insertItems([1]);
      await associate(a, [CTX.A]);

      await repo.callSubstitute([a], undefined, securityContext(1, CTX.ADMIN));

      expect(await associations()).toEqual([[a, CTX.ADMIN]]);
    });

    it('does nothing when relationIds is empty or only contains invalid ids', async () => {
      const [a] = await insertItems([1]);
      await associate(a, [CTX.A]);

      await repo.callSubstitute([], [code('B')]);
      await repo.callSubstitute([0, -1], [code('B')]);

      expect(await associations()).toEqual([[a, CTX.A]]);
    });

    it('works across multiple batches', async () => {
      const rows = await dataSource.query(
        `INSERT INTO test_items (name, website_id)
         SELECT 'bulk', 1 FROM generate_series(1, 2500) RETURNING id`,
      );
      const allIds: number[] = rows.map((r: { id: number }) => r.id);
      await repo.callAdd(allIds, [code('A')]);

      await repo.callSubstitute(allIds, [code('B')]);

      const [{ a, b }] = await dataSource.query(
        `SELECT COUNT(*) FILTER (WHERE context_id = $1)::int AS a,
                COUNT(*) FILTER (WHERE context_id = $2)::int AS b
         FROM test_item_contexts`,
        [CTX.A, CTX.B],
      );
      expect(a).toBe(0);
      expect(b).toBe(2500);
    });
  });

  // -------------------------------------------------------------------------
  describe('applyContextRules', () => {
    let i1: number, i2: number, i3: number;

    beforeEach(async () => {
      [i1, i2, i3] = await insertItems([1, 1, 1]);
      await insertItems([1]); // i4: no context at all
      await associate(i1, [CTX.A]);
      await associate(i2, [CTX.B]);
      await associate(i3, [CTX.A, CTX.B]);
    });

    it("filters by the user's own context when no contexts are passed", async () => {
      const q = repo.qb();
      repo.applyRules(q, undefined, securityContext(1, CTX.A));

      expect(ids(await q.getMany())).toEqual([i1, i3]);
    });

    it('filters by the explicit contexts (IN) and ignores the user context', async () => {
      const q = repo.qb();
      repo.applyRules(q, [code('B')], securityContext(1, CTX.A));

      expect(ids(await q.getMany())).toEqual([i2, i3]);
    });

    it('supports several explicit contexts', async () => {
      const q = repo.qb();
      repo.applyRules(q, [code('A'), code('B')], securityContext(1, CTX.ADMIN));

      expect(ids(await q.getMany())).toEqual([i1, i2, i3]);
    });

    it('throws when the user has no associated context', () => {
      expect(() => repo.applyRules(repo.qb(), undefined, securityContext(1, undefined))).toThrow(
        'User does not have an associated context',
      );
    });

    it('does not join the context table twice when applied repeatedly', async () => {
      const q = repo.qb();
      repo.applyRules(q, undefined, securityContext(1, CTX.A));
      repo.applyRules(q, undefined, securityContext(1, CTX.A));

      expect(q.expressionMap.joinAttributes).toHaveLength(1);
      expect(ids(await q.getMany())).toEqual([i1, i3]);
    });

    it('joins the helper table first when hasHelperTable is true', async () => {
      const c1 = await dataSource.query(
        'INSERT INTO test_children (item_id) VALUES ($1), ($2), ($3) RETURNING id',
        [i1, i2, i1],
      );
      const [child1, child2, child3] = c1.map((r: { id: number }) => r.id);

      const q = childRepo.qb();
      childRepo.applyRules(q, undefined, securityContext(1, CTX.A));

      // children of i1 (ctx A) -> child1, child3 ; child2 belongs to i2 (ctx B)
      expect(ids(await q.getMany())).toEqual([child1, child3]);
      expect(ids(await q.getMany())).not.toContain(child2);
      expect(q.expressionMap.joinAttributes).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  describe('customContextRuleQuery', () => {
    const USER = 5;
    const TEAM = 100;
    let inTeamSite: number; // item whose website belongs to the user's team
    let otherSite: number; // item whose website does NOT belong to the user's team
    let otherContext: number; // item in another context

    beforeEach(async () => {
      [inTeamSite, otherSite, otherContext] = await insertItems([10, 20, 10]);
      await associate(inTeamSite, [CTX.A]);
      await associate(otherSite, [CTX.A]);
      await associate(otherContext, [CTX.B]);

      await dataSource.query('INSERT INTO team_member (user_id, team_id) VALUES ($1, $2)', [
        USER,
        TEAM,
      ]);
      await dataSource.query('INSERT INTO team_websites (website_id, team_id) VALUES ($1, $2)', [
        10,
        TEAM,
      ]);
    });

    async function run(sc: SecurityContext): Promise<number[]> {
      const q = repo.qb().where('1 = 1');
      repo.applyCustomRule(q, sc);
      return ids(await q.getMany());
    }

    it('throws when the security context is incomplete', () => {
      const q = repo.qb().where('1 = 1');
      expect(() => repo.applyCustomRule(q, securityContext(undefined as any, CTX.A))).toThrow(
        'Incomplete security context provided',
      );
      expect(() => repo.applyCustomRule(q, securityContext(USER, undefined))).toThrow(
        'Incomplete security context provided',
      );
    });

    it('admin sees everything that is in the admin context, without team checks', async () => {
      await associate(inTeamSite, [CTX.ADMIN]);
      await associate(otherSite, [CTX.ADMIN]);

      expect(await run(securityContext(999, CTX.ADMIN))).toEqual([inTeamSite, otherSite]);
    });

    it('non-admin only sees items from their own context', async () => {
      const result = await run(securityContext(USER, CTX.A));

      expect(result).not.toContain(otherContext);
    });

    it('non-admin without any team sees nothing', async () => {
      expect(await run(securityContext(777, CTX.A))).toEqual([]);
    });

    it('non-admin only sees items whose website belongs to one of their teams', async () => {
      expect(await run(securityContext(USER, CTX.A))).toEqual([inTeamSite]);
    });
  });
  describe('customContextRuleQuery - Edge Cases & Security Boundaries', () => {
    const USER = 5;
    const TEAM = 100;
    let siteWithTeam: number;
    let siteWithoutTeam: number;

    beforeEach(async () => {
      [siteWithTeam, siteWithoutTeam] = await insertItems([10, 30]);
      await associate(siteWithTeam, [CTX.A]);
      await associate(siteWithoutTeam, [CTX.A]);

      await dataSource.query('INSERT INTO team_member (user_id, team_id) VALUES ($1, $2)', [
        USER,
        TEAM,
      ]);
      await dataSource.query('INSERT INTO team_websites (website_id, team_id) VALUES ($1, $2)', [
        10,
        TEAM,
      ]);
    });

    async function run(sc: SecurityContext): Promise<number[]> {
      const q = repo.qb().where('1 = 1');
      repo.applyCustomRule(q, sc);
      return ids(await q.getMany());
    }

    it('should prevent cross-context data leakage even if a team website matches', async () => {
      // O item está associado ao website 10 (que pertence à team do user), mas pertence ao contexto B (CTX.B)
      const [crossContextItem] = await insertItems([10]);
      await associate(crossContextItem, [CTX.B]);

      // O utilizador pede o contexto A (CTX.A)
      const result = await run(securityContext(USER, CTX.A));

      expect(result).toContain(siteWithTeam);
      expect(result).not.toContain(crossContextItem); // Blindagem contra fuga de contexto
    });

    it('should handle multiple teams and multiple websites correctly for the same user', async () => {
      const TEAM_2 = 200;
      const [siteFromTeam2] = await insertItems([40]);
      await associate(siteFromTeam2, [CTX.A]);

      await dataSource.query('INSERT INTO team_member (user_id, team_id) VALUES ($1, $2)', [
        USER,
        TEAM_2,
      ]);
      await dataSource.query('INSERT INTO team_websites (website_id, team_id) VALUES ($1, $2)', [
        40,
        TEAM_2,
      ]);

      const result = await run(securityContext(USER, CTX.A));

      expect(result).toEqual(expect.arrayContaining([siteWithTeam, siteFromTeam2]));
      expect(result).not.toContain(siteWithoutTeam);
    });
  });

  // --- NOVOS EDGE CASES PARA substituição e concorrência em lotes ---
  describe('substituteContextRules - Advanced Edge Cases', () => {
    it('should handle completely disjoint arrays during bulk substitution without side effects', async () => {
      const [a, b] = await insertItems([1, 1]);
      await associate(a, [CTX.A]);
      await associate(b, [CTX.B]);

      // Substitui os contextos do item 'a' para CTX.B, o item 'b' não deve ser tocado
      await repo.callSubstitute([a], [code('B')]);

      expect(await associations()).toEqual([
        [a, CTX.B],
        [b, CTX.B],
      ]);
    });
  });
});
