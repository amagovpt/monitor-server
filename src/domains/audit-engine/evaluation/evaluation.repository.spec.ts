import * as crypto from 'crypto';
import * as path from 'path';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { DataSource, EntityMetadata, EntityNotFoundError, Repository } from 'typeorm';
import type { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppLoggerService } from '@core/app-logger/app-logger.service';
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { ContextEnum, ContextMap } from 'src/domains/inventory/context/context.enum';
import { Evaluation, PublishStatus } from './entities/evaluation.entity';
import { EvaluationContext } from './entities/contexts-evaluation.entity';
import { EVALUATION_CONTEXT_METADATA_CONFIG } from './evaluation.constants';
import { EvaluationRepository } from './evaluation.repository';
import { EvaluationScoring } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CTX = {
  AMS: ContextMap[ContextEnum.AMS],
  MONITOR: ContextMap[ContextEnum.MONITOR],
  OBSERVATORY: ContextMap[ContextEnum.OBSERVATORY],
} as const;

const securityContext = (userId: number, contextId: number | undefined) =>
  ({
    user: { id: userId, context: contextId === undefined ? undefined : { id: contextId } },
  }) as unknown as SecurityContext;

/** day n of january 2026, UTC */
const day = (n: number) => new Date(Date.UTC(2026, 0, 1 + n));

// numeric enums list names too; keep only the real values
const statusValues = (() => {
  const vals = Object.values(PublishStatus) as unknown[];
  const nums = vals.filter((v) => typeof v === 'number');
  return (nums.length ? nums : vals) as PublishStatus[];
})();

describe('EvaluationRepository Integration (Testcontainers + Postgres)', () => {
  let container: StartedTestContainer;
  let dataSource: DataSource;
  let repo: EvaluationRepository;
  let ormRepo: Repository<Evaluation>;

  const logger = {
    setContext: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  } as unknown as AppLoggerService;
  const config = { get: jest.fn((_k: string, def: unknown) => def) } as unknown as ConfigService;

  // =========================================================================
  // Schema-driven seeding.
  // The test builds rows from the real entity metadata: every NOT NULL column without a default
  // gets a dummy value and every required parent row (FK) is created on the fly. Tests only
  // state the values they care about. Overrides can be keyed by property name, database column
  // name, or relation property name.
  // =========================================================================
  type Target = Function | string | EntityMetadata;
  let seq = 0;

  const metaOf = (t: Target): EntityMetadata => {
    if (t instanceof EntityMetadata) return t;
    if (typeof t === 'string') {
      const m = dataSource.entityMetadatas.find((e) => e.tableName === t);
      if (!m) throw new Error(`No entity mapped to table "${t}"`);
      return m;
    }
    return dataSource.getMetadata(t);
  };

  function dummyFor(col: ColumnMetadata): unknown {
    const n = ++seq;
    const t = col.type as unknown;
    if (col.enum?.length) return col.enum[0];
    if (t === Boolean || t === 'boolean' || t === 'bool') return false;
    if (
      t === Number ||
      ['int', 'integer', 'int2', 'int4', 'int8', 'smallint', 'bigint', 'float', 'float4', 'float8',
        'double precision', 'real', 'numeric', 'decimal'].includes(t as string)
    ) {
      return n;
    }
    if (t === Date || (typeof t === 'string' && /^(timestamp|date|time)/.test(t))) return new Date();
    if (typeof t === 'string' && /json/.test(t)) return {};
    if (t === 'simple-array' || col.isArray) return [];
    if (t === 'uuid') return crypto.randomUUID();
    const s = `${col.propertyName}_${n}`;
    return col.length ? s.slice(0, Number(col.length)) : s;
  }

  async function buildValues(
    target: Target,
    overrides: Record<string, any> = {},
    depth = 0,
  ): Promise<Record<string, any>> {
    if (depth > 6) throw new Error('Seed recursion too deep (circular required relations?)');
    const meta = metaOf(target);

    const resolved = new Map<ColumnMetadata, unknown>();
    for (const [key, value] of Object.entries(overrides)) {
      const rel = meta.relations.find((r) => r.propertyName === key);
      const col = rel
        ? rel.joinColumns[0]
        : meta.columns.find((c) => c.propertyName === key || c.databaseName === key);
      if (!col) throw new Error(`Unknown column/relation "${key}" on ${meta.tableName}`);
      let v = value;
      if (rel && value && typeof value === 'object') v = value[col.referencedColumn!.propertyName];
      resolved.set(col, v);
    }

    const values: Record<string, any> = {};
    for (const col of meta.columns) {
      if (resolved.has(col)) {
        values[col.propertyName] = resolved.get(col);
        continue;
      }
      if (col.isGenerated || col.isCreateDate || col.isUpdateDate || col.isDeleteDate || col.isVersion) {
        continue;
      }
      if (col.isNullable || col.default !== undefined) continue;
      if (col.relationMetadata) {
        const parent = await make(col.relationMetadata.inverseEntityMetadata, {}, depth + 1);
        values[col.propertyName] = parent[col.referencedColumn!.propertyName];
        continue;
      }
      values[col.propertyName] = dummyFor(col);
    }
    return values;
  }

  async function make(target: Target, overrides: Record<string, any> = {}, depth = 0): Promise<any> {
    const meta = metaOf(target);
    const values = await buildValues(meta, overrides, depth);
    return dataSource.getRepository(meta.target as any).save(values as any);
  }

  // ---- domain seeding -----------------------------------------------------
  const evalMeta = () => dataSource.getMetadata(Evaluation);
  const pageMeta = () => evalMeta().findRelationWithPropertyPath('page')!.inverseEntityMetadata;
  const websiteMeta = () => pageMeta().findRelationWithPropertyPath('website')!.inverseEntityMetadata;
  const tagMeta = () =>
    dataSource.entityMetadatas
      .find((m) => m.tableName === 'website_tags')!
      .foreignKeys.find((fk) => fk.columnNames.includes('tag_id'))!.referencedEntityMetadata;
  const directoryMeta = () => metaOf('directories');

  const makeWebsite = (o: Record<string, any> = {}) => make(websiteMeta(), o);
  const makePage = (website: { id: number }, o: Record<string, any> = {}) =>
    make(pageMeta(), { website, ...o });

  async function makeEvaluation(
    page: { id: number },
    o: {
      createdAt?: Date;
      updatedAt?: Date;
      score?: string;
      status?: PublishStatus;
      pageTitle?: string;
      contexts?: number[];
    } = {},
  ): Promise<Evaluation> {
    const { contexts = [CTX.MONITOR], ...fields } = o;
    const overrides: Record<string, any> = { pageId: page.id };
    for (const [k, v] of Object.entries(fields)) if (v !== undefined) overrides[k] = v;

    const ev = (await make(Evaluation, overrides)) as Evaluation;
    for (const contextId of contexts) {
      await dataSource.getRepository(EvaluationContext).insert({ evaluationId: ev.id, contextId } as any);
    }
    return ev;
  }

  /** the context rows the evaluation_context table points at (if it has an FK) */
  async function ensureContextRows(): Promise<void> {
    const ctxCol = dataSource
      .getMetadata(EvaluationContext)
      .columns.find((c) => c.propertyName === 'contextId')!;
    const parent = ctxCol.relationMetadata?.inverseEntityMetadata;
    if (!parent) return;
    const refProp = ctxCol.referencedColumn!.propertyName;
    for (const id of Object.values(CTX)) {
      await make(parent, { [refProp]: id });
    }
  }

  async function contextsOf(evaluationId: number): Promise<number[]> {
    const rows = await dataSource
      .getRepository(EvaluationContext)
      .find({ where: { evaluationId } as any });
    return rows.map((r: any) => r.contextId).sort((a, b) => a - b);
  }

  const countEvaluations = () => ormRepo.count();
  const idsOf = (rows: Array<{ id: number }>) => rows.map((r) => r.id);

  const queryArgs = (o: Record<string, any> = {}) =>
    ({
      filters: {},
      sortings: { id: 'ASC' },
      pagination: { page: 1, limit: 50 },
      contexts: [] as ContextEnum[],
      securityContext: securityContext(1, CTX.MONITOR),
      ...o,
    }) as any;

  // =========================================================================
  beforeAll(async () => {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({ POSTGRES_USER: 'test', POSTGRES_PASSWORD: 'test', POSTGRES_DB: 'test' })
      .withExposedPorts(5432)
      // Postgres logs this twice (init server + real server)
      .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/, 2))
      .start();

    // Real entities (all of them, so relations resolve), schema generated from them.
    // Replace the glob with an explicit list if you prefer.
    dataSource = new DataSource({
      type: 'postgres',
      host: container.getHost(),
      port: container.getMappedPort(5432),
      username: 'test',
      password: 'test',
      database: 'test',
      entities: [path.join(process.cwd(), 'src/**/*.entity{.ts,.js}')],
      synchronize: true,
    });
    await dataSource.initialize();

    ormRepo = dataSource.getRepository(Evaluation);
    repo = new EvaluationRepository(ormRepo, logger, config, EVALUATION_CONTEXT_METADATA_CONFIG);
    await ensureContextRows();
  }, 180000);

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (container) await container.stop();
  });

  beforeEach(async () => {
    // websites -> pages -> evaluations -> evaluation contexts (and the tag join tables) cascade
    const tables = [websiteMeta().tableName, directoryMeta().tableName, tagMeta().tableName];
    await dataSource.query(
      `TRUNCATE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
  });

  // =========================================================================
  describe('constructor', () => {
    it('sets its logging context to the repository name', () => {
      expect(logger.setContext).toHaveBeenCalledWith('EvaluationRepository');
    });
  });

  // =========================================================================
  describe('findMany: dynamic filters and sorting', () => {
    let page1: any, page2: any;
    let e1: Evaluation, e2: Evaluation, e3: Evaluation;

    beforeEach(async () => {
      const website = await makeWebsite();
      page1 = await makePage(website);
      page2 = await makePage(website);
      // created: e1 < e2 < e3 ; updated: e1 > e2 > e3 ; score: e1 < e2 < e3
      e1 = await makeEvaluation(page1, { score: '2.0', createdAt: day(1), updatedAt: day(30) });
      e2 = await makeEvaluation(page1, { score: '5.5', createdAt: day(2), updatedAt: day(20) });
      e3 = await makeEvaluation(page2, { score: '9.0', createdAt: day(3), updatedAt: day(10) });
    });

    const find = (filters: any = {}, sortings: any = { id: 'ASC' }, pagination: any = {}) =>
      repo.findMany({ filters, sortings, pagination });

    it('filters by id', async () => {
      expect(idsOf((await find({ id: e2.id })).data)).toEqual([e2.id]);
    });

    it('filters by a list of numeric ids', async () => {
      expect(idsOf((await find({ ids: [e1.id, e3.id] })).data)).toEqual([e1.id, e3.id]);
    });

    it('filters by a list of ids given as strings', async () => {
      const res = await find({ ids: [String(e1.id), String(e2.id)] });

      expect(idsOf(res.data)).toEqual([e1.id, e2.id]);
    });

    it('filters by score', async () => {
      expect(idsOf((await find({ score: '5.5' })).data)).toEqual([e2.id]);
    });

    it('filters by page id', async () => {
      expect(idsOf((await find({ pageId: page1.id })).data)).toEqual([e1.id, e2.id]);
      expect(idsOf((await find({ pageId: page2.id })).data)).toEqual([e3.id]);
    });

    it('combines filters with AND', async () => {
      expect(idsOf((await find({ pageId: page1.id, score: '5.5' })).data)).toEqual([e2.id]);
      expect((await find({ pageId: page2.id, score: '5.5' })).data).toEqual([]);
    });

    it('returns an empty page (and zero total) when nothing matches', async () => {
      const res = await find({ id: 999999 });

      expect(res.data).toEqual([]);
      expect(res.meta.totalItems).toBe(0);
    });

    it('ignores filters whose value is undefined', async () => {
      expect(idsOf((await find({ pageId: undefined })).data)).toEqual([e1.id, e2.id, e3.id]);
    });

    it.each([
      ['id', 'ASC', [0, 1, 2]],
      ['id', 'DESC', [2, 1, 0]],
      ['score', 'ASC', [0, 1, 2]],
      ['score', 'DESC', [2, 1, 0]],
      ['createdAt', 'ASC', [0, 1, 2]],
      ['createdAt', 'DESC', [2, 1, 0]],
      ['updatedAt', 'ASC', [2, 1, 0]],
      ['updatedAt', 'DESC', [0, 1, 2]],
    ])('sorts by %s %s', async (field, order, expected) => {
      const all = [e1, e2, e3];

      const res = await find({}, { [field]: order });

      expect(idsOf(res.data)).toEqual(expected.map((i) => all[i].id));
    });

    it('sorts by page id, then by the next sort key', async () => {
      const res = await find({}, { pageId: 'DESC', id: 'DESC' });

      expect(idsOf(res.data)).toEqual([e3.id, e2.id, e1.id]);
    });

    it('paginates and reports totals', async () => {
      const res = await find({}, { id: 'ASC' }, { page: 2, limit: 2 });

      expect(idsOf(res.data)).toEqual([e3.id]);
      expect(res.meta).toMatchObject({ currentPage: 2, itemsPerPage: 2, totalItems: 3, totalPages: 2 });
    });
  });

  // =========================================================================
  describe('getManyEvaluations', () => {
    let w1: any, w2: any;
    let w1p1: any, w1p2: any, w2p1: any;

    beforeEach(async () => {
      w1 = await makeWebsite();
      w2 = await makeWebsite();
      w1p1 = await makePage(w1);
      w1p2 = await makePage(w1);
      w2p1 = await makePage(w2);
    });

    it('returns the evaluations of that page of that website, with the total count', async () => {
      const a = await makeEvaluation(w1p1);
      const b = await makeEvaluation(w1p1);
      await makeEvaluation(w1p2); // other page, same website
      await makeEvaluation(w2p1); // other website

      const res = await repo.getManyEvaluations(w1.id, w1p1.id, queryArgs());

      expect(idsOf(res.data)).toEqual([a.id, b.id]);
      expect(res.count).toBe(2);
    });

    it('returns nothing when the page does not belong to the given website', async () => {
      await makeEvaluation(w2p1);

      const res = await repo.getManyEvaluations(w1.id, w2p1.id, queryArgs());

      expect(res).toEqual({ data: [], count: 0 });
    });

    it('returns nothing for an unknown website or page', async () => {
      await makeEvaluation(w1p1);

      expect((await repo.getManyEvaluations(999999, w1p1.id, queryArgs())).data).toEqual([]);
      expect((await repo.getManyEvaluations(w1.id, 999999, queryArgs())).data).toEqual([]);
    });

    it('returns the evaluations together with their page', async () => {
      await makeEvaluation(w1p1);

      const { data } = await repo.getManyEvaluations(w1.id, w1p1.id, queryArgs());

      expect((data[0] as any).page).toMatchObject({ id: w1p1.id });
    });

    describe('context rules', () => {
      it("only returns evaluations in the user's own context when no contexts are requested", async () => {
        const mon = await makeEvaluation(w1p1, { contexts: [CTX.MONITOR] });
        await makeEvaluation(w1p1, { contexts: [CTX.OBSERVATORY] });
        const both = await makeEvaluation(w1p1, { contexts: [CTX.MONITOR, CTX.OBSERVATORY] });

        const res = await repo.getManyEvaluations(
          w1.id,
          w1p1.id,
          queryArgs({ securityContext: securityContext(1, CTX.MONITOR) }),
        );

        expect(idsOf(res.data)).toEqual([mon.id, both.id]);
        expect(res.count).toBe(2);
      });

      it('shows different results to users of different contexts', async () => {
        await makeEvaluation(w1p1, { contexts: [CTX.MONITOR] });
        const obs = await makeEvaluation(w1p1, { contexts: [CTX.OBSERVATORY] });

        const res = await repo.getManyEvaluations(
          w1.id,
          w1p1.id,
          queryArgs({ securityContext: securityContext(2, CTX.OBSERVATORY) }),
        );

        expect(idsOf(res.data)).toEqual([obs.id]);
      });

      it("uses the requested contexts instead of the user's context", async () => {
        await makeEvaluation(w1p1, { contexts: [CTX.MONITOR] });
        const obs = await makeEvaluation(w1p1, { contexts: [CTX.OBSERVATORY] });

        const res = await repo.getManyEvaluations(
          w1.id,
          w1p1.id,
          queryArgs({
            contexts: [ContextEnum.OBSERVATORY],
            securityContext: securityContext(1, CTX.MONITOR),
          }),
        );

        expect(idsOf(res.data)).toEqual([obs.id]);
      });

      it('returns evaluations of any of several requested contexts', async () => {
        const mon = await makeEvaluation(w1p1, { contexts: [CTX.MONITOR] });
        const obs = await makeEvaluation(w1p1, { contexts: [CTX.OBSERVATORY] });
        await makeEvaluation(w1p1, { contexts: [CTX.AMS] });

        const res = await repo.getManyEvaluations(
          w1.id,
          w1p1.id,
          queryArgs({ contexts: [ContextEnum.MONITOR, ContextEnum.OBSERVATORY] }),
        );

        expect(idsOf(res.data)).toEqual([mon.id, obs.id]);
      });

      it('lists an evaluation that is in several requested contexts once, and counts it once', async () => {
        const both = await makeEvaluation(w1p1, { contexts: [CTX.MONITOR, CTX.OBSERVATORY] });

        const res = await repo.getManyEvaluations(
          w1.id,
          w1p1.id,
          queryArgs({ contexts: [ContextEnum.MONITOR, ContextEnum.OBSERVATORY] }),
        );

        expect(idsOf(res.data)).toEqual([both.id]);
        expect(res.count).toBe(1);
      });

      it('throws when the user has no context', async () => {
        await expect(
          repo.getManyEvaluations(
            w1.id,
            w1p1.id,
            queryArgs({ securityContext: securityContext(1, undefined) }),
          ),
        ).rejects.toThrow('User does not have an associated context');
      });
    });

    describe('filters, sorting and pagination', () => {
      it('applies the dynamic filters', async () => {
        await makeEvaluation(w1p1, { score: '2.0' });
        const high = await makeEvaluation(w1p1, { score: '9.0' });

        const res = await repo.getManyEvaluations(
          w1.id,
          w1p1.id,
          queryArgs({ filters: { score: '9.0' } }),
        );

        expect(idsOf(res.data)).toEqual([high.id]);
        expect(res.count).toBe(1);
      });

      it('applies the sorting', async () => {
        const old = await makeEvaluation(w1p1, { createdAt: day(1) });
        const recent = await makeEvaluation(w1p1, { createdAt: day(5) });

        const res = await repo.getManyEvaluations(
          w1.id,
          w1p1.id,
          queryArgs({ sortings: { createdAt: 'DESC' } }),
        );

        expect(idsOf(res.data)).toEqual([recent.id, old.id]);
      });

      it('pages the result and keeps the total count of the whole result set', async () => {
        const all: Evaluation[] = [];
        for (let i = 0; i < 5; i++) all.push(await makeEvaluation(w1p1));

        const page2 = await repo.getManyEvaluations(
          w1.id,
          w1p1.id,
          queryArgs({ pagination: { page: 2, limit: 2 } }),
        );

        expect(idsOf(page2.data)).toEqual([all[2].id, all[3].id]);
        expect(page2.count).toBe(5);
      });

      it('count does not include evaluations hidden by the context rules', async () => {
        await makeEvaluation(w1p1, { contexts: [CTX.MONITOR] });
        await makeEvaluation(w1p1, { contexts: [CTX.OBSERVATORY] });
        await makeEvaluation(w1p1, { contexts: [CTX.OBSERVATORY] });

        const res = await repo.getManyEvaluations(w1.id, w1p1.id, queryArgs());

        expect(res.count).toBe(1);
      });

      // Every page must hold `limit` distinct evaluations, even when an evaluation matches
      // through several of the requested contexts.
      it('paginates by evaluation, not by joined context row', async () => {
        const evs: Evaluation[] = [];
        for (let i = 0; i < 3; i++) {
          evs.push(await makeEvaluation(w1p1, { contexts: [CTX.MONITOR, CTX.OBSERVATORY] }));
        }
        const contexts = [ContextEnum.MONITOR, ContextEnum.OBSERVATORY];

        const first = await repo.getManyEvaluations(
          w1.id,
          w1p1.id,
          queryArgs({ contexts, pagination: { page: 1, limit: 2 } }),
        );
        const second = await repo.getManyEvaluations(
          w1.id,
          w1p1.id,
          queryArgs({ contexts, pagination: { page: 2, limit: 2 } }),
        );

        expect(first.count).toBe(3);
        expect(idsOf(first.data)).toEqual([evs[0].id, evs[1].id]);
        expect(idsOf(second.data)).toEqual([evs[2].id]);
      });
    });
  });

  // =========================================================================
  describe('createEvaluation', () => {
    let website: any;
    let page: any;

    const newEvaluation = async (overrides: Record<string, any> = {}) =>
      ormRepo.create((await buildValues(Evaluation, { pageId: page.id, ...overrides })) as any);

    beforeEach(async () => {
      website = await makeWebsite();
      page = await makePage(website);
    });

    it('saves the evaluation and returns it with its generated id', async () => {
      const saved = await repo.createEvaluation(await newEvaluation({ score: '6.5' }), CTX.MONITOR);

      expect(saved.id).toBeGreaterThan(0);
      const stored = await ormRepo.findOneByOrFail({ id: saved.id });
      expect(stored.pageId).toBe(page.id);
      expect(Number(stored.score)).toBe(6.5);
    });

    it('links the evaluation to the given context', async () => {
      const saved = await repo.createEvaluation(await newEvaluation(), CTX.OBSERVATORY);

      expect(await contextsOf(saved.id)).toEqual([CTX.OBSERVATORY]);
    });

    it('makes the new evaluation visible only through its context', async () => {
      const saved = await repo.createEvaluation(await newEvaluation(), CTX.OBSERVATORY);

      const asObservatory = await repo.findEvaluationById(
        website.id,
        page.id,
        saved.id,
        securityContext(1, CTX.OBSERVATORY),
      );
      const asMonitor = await repo.findEvaluationById(
        website.id,
        page.id,
        saved.id,
        securityContext(2, CTX.MONITOR),
      );

      expect(asObservatory?.id).toBe(saved.id);
      expect(asMonitor).toBeNull();
    });

    it('creates independent evaluations on repeated calls', async () => {
      const a = await repo.createEvaluation(await newEvaluation(), CTX.MONITOR);
      const b = await repo.createEvaluation(await newEvaluation(), CTX.AMS);

      expect(a.id).not.toBe(b.id);
      expect(await contextsOf(a.id)).toEqual([CTX.MONITOR]);
      expect(await contextsOf(b.id)).toEqual([CTX.AMS]);
    });

    it('is atomic: the evaluation is not kept when the context link cannot be saved', async () => {
      const before = await countEvaluations();

      await expect(
        repo.createEvaluation(await newEvaluation(), null as unknown as number),
      ).rejects.toThrow();

      expect(await countEvaluations()).toBe(before);
    });

    it('does not save anything when the evaluation itself is invalid', async () => {
      const before = await countEvaluations();
      const invalid = await newEvaluation({ pageId: 999999 }); // page does not exist

      await expect(repo.createEvaluation(invalid, CTX.MONITOR)).rejects.toThrow();

      expect(await countEvaluations()).toBe(before);
      expect(await dataSource.getRepository(EvaluationContext).count()).toBe(0);
    });
  });

  // =========================================================================
  describe('createManyEvaluations', () => {
    let page: any;

    const newEvaluations = async (n: number) => {
      const out: Evaluation[] = [];
      for (let i = 0; i < n; i++) {
        out.push(ormRepo.create((await buildValues(Evaluation, { pageId: page.id })) as any) as any);
      }
      return out;
    };

    beforeEach(async () => {
      page = await makePage(await makeWebsite());
    });

    it('saves every evaluation and returns them in the given order, with ids', async () => {
      const input = await newEvaluations(3);
      input[0].pageTitle = 'first';
      input[1].pageTitle = 'second';
      input[2].pageTitle = 'third';

      const saved = await repo.createManyEvaluations(input, CTX.MONITOR);

      expect(saved.map((s) => s.pageTitle)).toEqual(['first', 'second', 'third']);
      expect(saved.every((s) => s.id > 0)).toBe(true);
      expect(new Set(saved.map((s) => s.id)).size).toBe(3);
      expect(await countEvaluations()).toBe(3);
    });

    it('links each evaluation to the given context, once', async () => {
      const saved = await repo.createManyEvaluations(await newEvaluations(4), CTX.OBSERVATORY);

      for (const s of saved) {
        expect(await contextsOf(s.id)).toEqual([CTX.OBSERVATORY]);
      }
      expect(await dataSource.getRepository(EvaluationContext).count()).toBe(4);
    });

    it('handles a large batch', async () => {
      const saved = await repo.createManyEvaluations(await newEvaluations(120), CTX.MONITOR);

      expect(saved).toHaveLength(120);
      expect(await countEvaluations()).toBe(120);
      expect(await dataSource.getRepository(EvaluationContext).count()).toBe(120);
    });

    it('returns an empty list and saves nothing for an empty input', async () => {
      expect(await repo.createManyEvaluations([], CTX.MONITOR)).toEqual([]);

      expect(await countEvaluations()).toBe(0);
      expect(await dataSource.getRepository(EvaluationContext).count()).toBe(0);
    });

    it('is atomic: none of the evaluations is kept when the context links cannot be saved', async () => {
      await expect(
        repo.createManyEvaluations(await newEvaluations(3), null as unknown as number),
      ).rejects.toThrow();

      expect(await countEvaluations()).toBe(0);
    });

    it('is atomic: none is kept when one of the evaluations is invalid', async () => {
      const input = await newEvaluations(3);
      (input[2] as any).pageId = 999999; // page does not exist

      await expect(repo.createManyEvaluations(input, CTX.MONITOR)).rejects.toThrow();

      expect(await countEvaluations()).toBe(0);
      expect(await dataSource.getRepository(EvaluationContext).count()).toBe(0);
    });
  });

  // =========================================================================
  describe('updateEntityFromRawData', () => {
    let page: any;
    let ev: Evaluation;

    const raw = {
      title: 'Brand new title',
      A: 3,
      AA: 2,
      AAA: 1,
      score: '7.5',
      createdAt: '2026-02-03T10:20:30.000Z',
    } as unknown as EvaluationScoring;

    beforeEach(async () => {
      page = await makePage(await makeWebsite());
      ev = await makeEvaluation(page, {
        score: '1.0',
        pageTitle: 'old title',
        status: statusValues[0],
        createdAt: day(1),
      });
    });

    it('copies title, A, AA, AAA and score from the raw data and persists them', async () => {
      await repo.updateEntityFromRawData(ev.id, raw);

      const stored = await ormRepo.findOneByOrFail({ id: ev.id });
      expect(stored.pageTitle).toBe('Brand new title');
      expect(stored.A).toEqual(3);
      expect(stored.AA).toEqual(2);
      expect(stored.AAA).toEqual(1);
      expect(Number(stored.score)).toBe(7.5);
    });

    it('sets the creation and update timestamps to the evaluation time of the raw data', async () => {
      await repo.updateEntityFromRawData(ev.id, raw);

      const stored = await ormRepo.findOneByOrFail({ id: ev.id });
      expect(stored.createdAt.toISOString()).toBe('2026-02-03T10:20:30.000Z');
      expect(stored.updatedAt.toISOString()).toBe('2026-02-03T10:20:30.000Z');
    });

    it('returns the updated evaluation', async () => {
      const res = await repo.updateEntityFromRawData(ev.id, raw);

      expect(res.id).toBe(ev.id);
      expect(res.pageTitle).toBe('Brand new title');
      expect(Number(res.score)).toBe(7.5);
    });

    it('keeps the page and status of the evaluation', async () => {
      await repo.updateEntityFromRawData(ev.id, raw);

      const stored = await ormRepo.findOneByOrFail({ id: ev.id });
      expect(stored.pageId).toBe(page.id);
      expect(stored.status).toBe(statusValues[0]);
    });

    it('does not touch other evaluations', async () => {
      const other = await makeEvaluation(page, { score: '4.0', pageTitle: 'other', createdAt: day(9) });

      await repo.updateEntityFromRawData(ev.id, raw);

      const stored = await ormRepo.findOneByOrFail({ id: other.id });
      expect(stored.pageTitle).toBe('other');
      expect(Number(stored.score)).toBe(4);
      expect(stored.createdAt.toISOString()).toBe(day(9).toISOString());
    });

    it('fails with EntityNotFoundError for an unknown evaluation', async () => {
      await expect(repo.updateEntityFromRawData(999999, raw)).rejects.toThrow(EntityNotFoundError);
    });
  });

  // =========================================================================
  describe.each([['updateStatus'], ['updatePublishStatus']] as const)('%s', (method) => {
    let page: any;
    let ev: Evaluation;

    beforeEach(async () => {
      page = await makePage(await makeWebsite());
      ev = await makeEvaluation(page, { status: statusValues[0], score: '3.0', pageTitle: 'keep me' });
    });

    it('persists the new status', async () => {
      await repo[method](ev.id, statusValues[1]);

      expect((await ormRepo.findOneByOrFail({ id: ev.id })).status).toBe(statusValues[1]);
    });

    it('returns the evaluation with the new status', async () => {
      const res = await repo[method](ev.id, statusValues[1]);

      expect(res.id).toBe(ev.id);
      expect(res.status).toBe(statusValues[1]);
    });

    it('can switch back and forth between statuses', async () => {
      await repo[method](ev.id, statusValues[1]);
      await repo[method](ev.id, statusValues[0]);

      expect((await ormRepo.findOneByOrFail({ id: ev.id })).status).toBe(statusValues[0]);
    });

    it('only changes the status', async () => {
      await repo[method](ev.id, statusValues[1]);

      const stored = await ormRepo.findOneByOrFail({ id: ev.id });
      expect(stored.pageTitle).toBe('keep me');
      expect(Number(stored.score)).toBe(3);
      expect(stored.pageId).toBe(page.id);
    });

    it('does not change other evaluations', async () => {
      const other = await makeEvaluation(page, { status: statusValues[0] });

      await repo[method](ev.id, statusValues[1]);

      expect((await ormRepo.findOneByOrFail({ id: other.id })).status).toBe(statusValues[0]);
    });

    it('fails with EntityNotFoundError for an unknown evaluation', async () => {
      await expect(repo[method](999999, statusValues[1])).rejects.toThrow(EntityNotFoundError);
    });
  });

  // =========================================================================
  describe('findWithDetails', () => {
    let page1: any, page2: any;
    let old: Evaluation, mid: Evaluation, recent: Evaluation;

    beforeEach(async () => {
      const website = await makeWebsite();
      page1 = await makePage(website);
      page2 = await makePage(website);
      old = await makeEvaluation(page1, { createdAt: day(1), score: '2.0' });
      recent = await makeEvaluation(page1, { createdAt: day(9), score: '8.0' });
      mid = await makeEvaluation(page2, { createdAt: day(5), score: '5.0' });
    });

    it('returns the matching evaluations, newest first', async () => {
      const res = await repo.findWithDetails({ pageId: page1.id } as any);

      expect(idsOf(res)).toEqual([recent.id, old.id]);
    });

    it('returns everything, newest first, when no filter narrows the result', async () => {
      const res = await repo.findWithDetails({} as any);

      expect(idsOf(res)).toEqual([recent.id, mid.id, old.id]);
    });

    it('applies the dynamic filters', async () => {
      expect(idsOf(await repo.findWithDetails({ ids: [old.id, mid.id] } as any))).toEqual([
        mid.id,
        old.id,
      ]);
      expect(idsOf(await repo.findWithDetails({ score: '5.0' } as any))).toEqual([mid.id]);
    });

    it('returns an empty list when nothing matches', async () => {
      expect(await repo.findWithDetails({ id: 999999 } as any)).toEqual([]);
    });

    it('does not depend on the evaluation contexts', async () => {
      const noCtx = await makeEvaluation(page2, { contexts: [], createdAt: day(20) });

      const res = await repo.findWithDetails({ pageId: page2.id } as any);

      expect(idsOf(res)).toContain(noCtx.id);
    });

    // The method is named "WithDetails": the page the evaluation belongs to is expected to come
    // with it.
    it('returns each evaluation together with its page', async () => {
      const res = await repo.findWithDetails({ pageId: page1.id } as any);

      expect((res[0] as any).page).toMatchObject({ id: page1.id });
    });
  });

  // =========================================================================
  describe('findNewestByPageId', () => {
    let page1: any, page2: any;

    beforeEach(async () => {
      const website = await makeWebsite();
      page1 = await makePage(website);
      page2 = await makePage(website);
    });

    it('returns the most recently created evaluation of the page', async () => {
      await makeEvaluation(page1, { createdAt: day(1) });
      const newest = await makeEvaluation(page1, { createdAt: day(7) });
      await makeEvaluation(page1, { createdAt: day(3) });

      const res = await repo.findNewestByPageId(page1.id);

      expect(res?.id).toBe(newest.id);
    });

    it('does not mix in evaluations of other pages, even if they are newer', async () => {
      const mine = await makeEvaluation(page1, { createdAt: day(1) });
      await makeEvaluation(page2, { createdAt: day(50) });

      expect((await repo.findNewestByPageId(page1.id))?.id).toBe(mine.id);
    });

    it('does not follow insertion order, only creation time', async () => {
      const newest = await makeEvaluation(page1, { createdAt: day(9) }); // inserted first
      await makeEvaluation(page1, { createdAt: day(2) }); // inserted last

      expect((await repo.findNewestByPageId(page1.id))?.id).toBe(newest.id);
    });

    it('returns null for a page without evaluations', async () => {
      await makeEvaluation(page2);

      expect(await repo.findNewestByPageId(page1.id)).toBeNull();
    });

    it('returns null for an unknown page', async () => {
      expect(await repo.findNewestByPageId(999999)).toBeNull();
    });
  });

  // =========================================================================
  describe('findEvaluationById', () => {
    let w1: any, w2: any;
    let w1p1: any, w1p2: any, w2p1: any;
    let monitorEval: Evaluation;

    beforeEach(async () => {
      w1 = await makeWebsite();
      w2 = await makeWebsite();
      w1p1 = await makePage(w1);
      w1p2 = await makePage(w1);
      w2p1 = await makePage(w2);
      monitorEval = await makeEvaluation(w1p1, { contexts: [CTX.MONITOR] });
    });

    const find = (website: any, page: any, id: number, sc = securityContext(1, CTX.MONITOR)) =>
      repo.findEvaluationById(website.id, page.id, id, sc);

    it('returns the evaluation when website, page, id and context all match', async () => {
      const res = await find(w1, w1p1, monitorEval.id);

      expect(res?.id).toBe(monitorEval.id);
      expect(res?.pageId).toBe(w1p1.id);
    });

    it('returns null when the website is not the one that owns the page', async () => {
      expect(await find(w2, w1p1, monitorEval.id)).toBeNull();
    });

    it('returns null when the evaluation belongs to another page', async () => {
      expect(await find(w1, w1p2, monitorEval.id)).toBeNull();
      expect(await find(w2, w2p1, monitorEval.id)).toBeNull();
    });

    it('returns null for an unknown evaluation', async () => {
      expect(await find(w1, w1p1, 999999)).toBeNull();
    });

    it("returns null when the evaluation is not in the user's context", async () => {
      const res = await find(w1, w1p1, monitorEval.id, securityContext(2, CTX.OBSERVATORY));

      expect(res).toBeNull();
    });

    it('returns the evaluation to a user of any of the contexts it belongs to', async () => {
      const shared = await makeEvaluation(w1p1, { contexts: [CTX.MONITOR, CTX.OBSERVATORY] });

      expect((await find(w1, w1p1, shared.id, securityContext(1, CTX.MONITOR)))?.id).toBe(shared.id);
      expect((await find(w1, w1p1, shared.id, securityContext(2, CTX.OBSERVATORY)))?.id).toBe(
        shared.id,
      );
    });

    it('throws when the user has no context', async () => {
      await expect(
        find(w1, w1p1, monitorEval.id, securityContext(1, undefined)),
      ).rejects.toThrow('User does not have an associated context');
    });
  });

  // =========================================================================
  describe('getMetadataForEvaluation', () => {
    const makeTag = () => make(tagMeta());
    const makeDirectory = (strategy: 'UNION' | 'INTERSECTION') =>
      make(directoryMeta(), { tag_matching_strategy: strategy });

    async function tagWebsite(websiteId: number, ...tagIds: number[]) {
      for (const tagId of tagIds) {
        await dataSource.query('INSERT INTO website_tags (website_id, tag_id) VALUES ($1, $2)', [
          websiteId,
          tagId,
        ]);
      }
    }
    async function tagDirectory(directoryId: number, ...tagIds: number[]) {
      for (const tagId of tagIds) {
        await dataSource.query('INSERT INTO directory_tags (directory_id, tag_id) VALUES ($1, $2)', [
          directoryId,
          tagId,
        ]);
      }
    }
    const institutionOf = async (websiteId: number): Promise<number> =>
      (await dataSource.query('SELECT institution_id FROM websites WHERE id = $1', [websiteId]))[0]
        .institution_id;

    const directoriesFor = async (websiteId: number) =>
      [...(await repo.getMetadataForEvaluation(websiteId)).directories_ids].sort((a, b) => a - b);

    it('throws NotFoundException with the website id when the website does not exist', async () => {
      await expect(repo.getMetadataForEvaluation(999999)).rejects.toThrow(NotFoundException);
      await expect(repo.getMetadataForEvaluation(999999)).rejects.toThrow(
        'Website with ID 999999 not found',
      );
    });

    it('returns the website id and its institution id', async () => {
      const website = await makeWebsite();

      const meta = await repo.getMetadataForEvaluation(website.id);

      expect(meta).toMatchObject({
        website_id: website.id,
        institution_id: await institutionOf(website.id),
      });
    });

    it('returns an empty directory list for a website without tags', async () => {
      const website = await makeWebsite();
      const dir = await makeDirectory('UNION');
      await tagDirectory(dir.id, (await makeTag()).id);

      expect((await repo.getMetadataForEvaluation(website.id)).directories_ids).toEqual([]);
    });

    it('returns an empty directory list when no directory uses the website tags', async () => {
      const website = await makeWebsite();
      const [mine, other] = [await makeTag(), await makeTag()];
      await tagWebsite(website.id, mine.id);
      const dir = await makeDirectory('UNION');
      await tagDirectory(dir.id, other.id);

      expect(await directoriesFor(website.id)).toEqual([]);
    });

    describe('UNION directories', () => {
      it('match when the website has at least one of their tags', async () => {
        const website = await makeWebsite();
        const [t1, t2, t3] = [await makeTag(), await makeTag(), await makeTag()];
        await tagWebsite(website.id, t1.id);
        const dir = await makeDirectory('UNION');
        await tagDirectory(dir.id, t1.id, t2.id, t3.id);

        expect(await directoriesFor(website.id)).toEqual([dir.id]);
      });

      it('are listed once even if several tags match', async () => {
        const website = await makeWebsite();
        const [t1, t2] = [await makeTag(), await makeTag()];
        await tagWebsite(website.id, t1.id, t2.id);
        const dir = await makeDirectory('UNION');
        await tagDirectory(dir.id, t1.id, t2.id);

        expect(await directoriesFor(website.id)).toEqual([dir.id]);
      });
    });

    describe('INTERSECTION directories', () => {
      it('match when the website has all of their tags', async () => {
        const website = await makeWebsite();
        const [t1, t2] = [await makeTag(), await makeTag()];
        await tagWebsite(website.id, t1.id, t2.id);
        const dir = await makeDirectory('INTERSECTION');
        await tagDirectory(dir.id, t1.id, t2.id);

        expect(await directoriesFor(website.id)).toEqual([dir.id]);
      });

      it('do not match when only some of their tags are on the website', async () => {
        const website = await makeWebsite();
        const [t1, t2] = [await makeTag(), await makeTag()];
        await tagWebsite(website.id, t1.id);
        const dir = await makeDirectory('INTERSECTION');
        await tagDirectory(dir.id, t1.id, t2.id);

        expect(await directoriesFor(website.id)).toEqual([]);
      });

      it('still match when the website has extra tags the directory does not use', async () => {
        const website = await makeWebsite();
        const [t1, t2, extra] = [await makeTag(), await makeTag(), await makeTag()];
        await tagWebsite(website.id, t1.id, t2.id, extra.id);
        const dir = await makeDirectory('INTERSECTION');
        await tagDirectory(dir.id, t1.id, t2.id);

        expect(await directoriesFor(website.id)).toEqual([dir.id]);
      });

      it('do not match just because the website has as many tags as required', async () => {
        const website = await makeWebsite();
        const [t1, t2, other] = [await makeTag(), await makeTag(), await makeTag()];
        await tagWebsite(website.id, t1.id, other.id); // 2 tags, but only 1 is required
        const dir = await makeDirectory('INTERSECTION');
        await tagDirectory(dir.id, t1.id, t2.id);

        expect(await directoriesFor(website.id)).toEqual([]);
      });

      it('with a single required tag behave like UNION', async () => {
        const website = await makeWebsite();
        const t1 = await makeTag();
        await tagWebsite(website.id, t1.id);
        const dir = await makeDirectory('INTERSECTION');
        await tagDirectory(dir.id, t1.id);

        expect(await directoriesFor(website.id)).toEqual([dir.id]);
      });
    });

    describe('several directories', () => {
      it('returns every matching directory and leaves out the others', async () => {
        const website = await makeWebsite();
        const [t1, t2, t3] = [await makeTag(), await makeTag(), await makeTag()];
        await tagWebsite(website.id, t1.id, t2.id);

        const unionMatch = await makeDirectory('UNION');
        await tagDirectory(unionMatch.id, t1.id, t3.id);
        const intersectionMatch = await makeDirectory('INTERSECTION');
        await tagDirectory(intersectionMatch.id, t1.id, t2.id);
        const intersectionMiss = await makeDirectory('INTERSECTION');
        await tagDirectory(intersectionMiss.id, t1.id, t3.id);
        const unionMiss = await makeDirectory('UNION');
        await tagDirectory(unionMiss.id, t3.id);

        expect(await directoriesFor(website.id)).toEqual(
          [unionMatch.id, intersectionMatch.id].sort((a, b) => a - b),
        );
      });

      it('never matches a directory that has no tags', async () => {
        const website = await makeWebsite();
        await tagWebsite(website.id, (await makeTag()).id);
        await makeDirectory('UNION');
        await makeDirectory('INTERSECTION');

        expect(await directoriesFor(website.id)).toEqual([]);
      });

      it('returns the same directory for two websites that share the tag', async () => {
        const [w1, w2] = [await makeWebsite(), await makeWebsite()];
        const t1 = await makeTag();
        await tagWebsite(w1.id, t1.id);
        await tagWebsite(w2.id, t1.id);
        const dir = await makeDirectory('UNION');
        await tagDirectory(dir.id, t1.id);

        expect(await directoriesFor(w1.id)).toEqual([dir.id]);
        expect(await directoriesFor(w2.id)).toEqual([dir.id]);
      });

      it("only considers the requested website's tags", async () => {
        const [mine, other] = [await makeWebsite(), await makeWebsite()];
        const [t1, t2] = [await makeTag(), await makeTag()];
        await tagWebsite(other.id, t1.id, t2.id);
        const dir = await makeDirectory('INTERSECTION');
        await tagDirectory(dir.id, t1.id, t2.id);
        await tagWebsite(mine.id, t1.id); // only one of the two

        expect(await directoriesFor(mine.id)).toEqual([]);
        expect(await directoriesFor(other.id)).toEqual([dir.id]);
      });

      it('returns the ids as numbers', async () => {
        const website = await makeWebsite();
        const t1 = await makeTag();
        await tagWebsite(website.id, t1.id);
        const dir = await makeDirectory('UNION');
        await tagDirectory(dir.id, t1.id);

        const meta = await repo.getMetadataForEvaluation(website.id);

        expect(typeof meta.website_id).toBe('number');
        expect(meta.directories_ids.every((d: unknown) => typeof d === 'number')).toBe(true);
      });
    });
  });
});