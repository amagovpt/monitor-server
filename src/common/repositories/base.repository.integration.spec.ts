import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import {
  Column,
  DataSource,
  Entity,
  EntityNotFoundError,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  SelectQueryBuilder,
  DeleteDateColumn,
} from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppLoggerService } from '@core/app-logger/app-logger.service';
import { EntityRepository, FilterMap, SortingMap } from './base.repository';
import { BaseFilter, BaseSort, SortCriteria } from '../interfaces/types';

// ---------------------------------------------------------------------------
// Test entities
// ---------------------------------------------------------------------------
@Entity('test_owners')
class TestOwner {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'text' }) label!: string;
}

@Entity('test_items')
class TestItem {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'text', nullable: true }) name!: string | null;
  @Column({ name: 'website_id', type: 'int' }) websiteId!: number;
  @Column({ name: 'owner_id', type: 'int', nullable: true }) ownerId!: number | null;

  @ManyToOne(() => TestOwner, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner?: TestOwner | null;
}

@Entity('soft_deletable_entities')
class SoftDeletableEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'varchar', name: 'name', default: '' })
  name!: string;

  @Column({ type: 'boolean', name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}

// ---------------------------------------------------------------------------
// Concrete repository used as the test target
// ---------------------------------------------------------------------------
type ItemFilter = BaseFilter & { name?: string; websiteId?: number; ids?: number[] };
type ItemSort = BaseSort & { name?: SortCriteria; id?: SortCriteria };

class TestItemRepository extends EntityRepository<TestItem, ItemFilter, ItemSort> {
  protected readonly alias = 'item';

  protected readonly filterMap = {
    name: (q: SelectQueryBuilder<TestItem>, v: string) => this.addFilter(q, 'name', v, 'like'),
    websiteId: (q: SelectQueryBuilder<TestItem>, v: number) =>
      this.addFilter(q, 'websiteId', v, 'eq'),
    ids: (q: SelectQueryBuilder<TestItem>, v: number[]) => this.addFilter(q, 'id', v, 'in'),
  } as unknown as FilterMap<ItemFilter, TestItem>;

  protected readonly sortMap = {
    name: (q: SelectQueryBuilder<TestItem>, o: SortCriteria) => this.addSort(q, 'name', o),
    id: (q: SelectQueryBuilder<TestItem>, o: SortCriteria) => this.addSort(q, 'id', o),
  } as unknown as SortingMap<ItemSort, TestItem>;

  constructor(dataSource: DataSource, logger: AppLoggerService, config: ConfigService) {
    super(dataSource.getRepository(TestItem), logger, config);
  }

  // expose protected members
  columnName(property: keyof TestItem) {
    return this.getColumnName(property);
  }
  getPrimaryKey() {
    return this.primaryKey;
  }
  getMaxLimit() {
    return this.maxPaginationLimit;
  }
}

// ---------------------------------------------------------------------------
// Concrete repository used as the test target
// ---------------------------------------------------------------------------
type SoftDeletableEntityFilter = BaseFilter & {};
type SoftDeletableSort = BaseSort & {};

class SoftDeletableEntityRepository extends EntityRepository<
  SoftDeletableEntity,
  SoftDeletableEntityFilter,
  SoftDeletableSort
> {
  protected readonly alias = 'soft_deletable_entity';

  protected readonly filterMap = {} as unknown as FilterMap<
    SoftDeletableEntityFilter,
    SoftDeletableEntity
  >;

  protected readonly sortMap = {} as unknown as SortingMap<SoftDeletableSort, SoftDeletableEntity>;

  constructor(dataSource: DataSource, logger: AppLoggerService, config: ConfigService) {
    super(dataSource.getRepository(SoftDeletableEntity), logger, config);
  }

  // expose protected members
  columnName(property: keyof SoftDeletableEntity) {
    return this.getColumnName(property);
  }
  getPrimaryKey() {
    return this.primaryKey;
  }
  getMaxLimit() {
    return this.maxPaginationLimit;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeConfig = (maxLimit?: number) =>
  ({
    get: jest.fn((key: string, def: unknown) =>
      key === 'PAGINATION_MAX_LIMIT' && maxLimit !== undefined ? maxLimit : def,
    ),
  }) as unknown as ConfigService;

describe('EntityRepository Integration (Testcontainers + Postgres)', () => {
  let container: StartedTestContainer;
  let dataSource: DataSource;
  let repo: TestItemRepository; // default max pagination limit (100)
  let limitedRepo: TestItemRepository; // PAGINATION_MAX_LIMIT = 5
  let softDeletableRepo: SoftDeletableEntityRepository;

  const logger = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  } as unknown as AppLoggerService;

  async function insertOwners(labels: string[]): Promise<number[]> {
    const rows = await dataSource.query(
      `INSERT INTO test_owners (label)
       SELECT * FROM unnest($1::text[]) RETURNING id`,
      [labels],
    );
    return rows.map((r: { id: number }) => r.id);
  }

  async function insertItems(
    rows: Array<{ name: string | null; websiteId: number; ownerId?: number | null }>,
  ): Promise<number[]> {
    const res = await dataSource.query(
      `INSERT INTO test_items (name, website_id, owner_id)
       SELECT * FROM unnest($1::text[], $2::int[], $3::int[])
       RETURNING id`,
      [rows.map((r) => r.name), rows.map((r) => r.websiteId), rows.map((r) => r.ownerId ?? null)],
    );
    return res.map((r: { id: number }) => r.id);
  }

  async function countItems(): Promise<number> {
    const [{ count }] = await dataSource.query('SELECT COUNT(*)::int AS count FROM test_items');
    return count;
  }

  async function insertSoftDeletableEntities(
    rows: Array<{ name: string | null }>,
  ): Promise<number[]> {
    const res = await dataSource.query(
      `INSERT INTO soft_deletable_entities (name)
       SELECT * FROM unnest($1::text[])
       RETURNING id`,
      [rows.map((r) => r.name)],
    );
    return res.map((r: { id: number }) => r.id);
  }

  const idsOf = (rows: Array<{ id: number }>) => rows.map((r) => r.id);

  beforeAll(async () => {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
        POSTGRES_DB: 'test',
      })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/, 2))
      .start();

    dataSource = new DataSource({
      type: 'postgres',
      host: container.getHost(),
      port: container.getMappedPort(5432),
      username: 'test',
      password: 'test',
      database: 'test',
      entities: [TestOwner, TestItem, SoftDeletableEntity],
      synchronize: false,
    });
    await dataSource.initialize();

    await dataSource.query(`
      CREATE TABLE test_owners (
        id    SERIAL PRIMARY KEY,
        label TEXT NOT NULL
      );
      CREATE TABLE test_items (
        id         SERIAL PRIMARY KEY,
        name       TEXT,
        website_id INT NOT NULL,
        owner_id   INT REFERENCES test_owners(id) ON DELETE SET NULL
      );
      CREATE TABLE soft_deletable_entities (
        id    SERIAL PRIMARY KEY,
        name  TEXT,
        deleted_at TIMESTAMP WITH TIME ZONE,
        is_deleted BOOLEAN DEFAULT FALSE
      );
    `);

    repo = new TestItemRepository(dataSource, logger, makeConfig());
    limitedRepo = new TestItemRepository(dataSource, logger, makeConfig(5));
    softDeletableRepo = new SoftDeletableEntityRepository(dataSource, logger, makeConfig());
  }, 120000);

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (container) await container.stop();
  });

  beforeEach(async () => {
    (logger.error as jest.Mock).mockClear();
    await dataSource.query(
      'TRUNCATE test_items, test_owners, soft_deletable_entities RESTART IDENTITY CASCADE',
    );
  });

  // -------------------------------------------------------------------------
  describe('constructor', () => {
    it('resolves the primary key from the entity metadata', () => {
      expect(repo.getPrimaryKey()).toBe('id');
    });

    it('reads PAGINATION_MAX_LIMIT from config, defaulting to 100', () => {
      expect(repo.getMaxLimit()).toBe(100);
      expect(limitedRepo.getMaxLimit()).toBe(5);
    });

    it('exposes the underlying TypeORM repository', () => {
      expect(repo.getOrmRepository().target).toBe(TestItem);
    });
  });

  // -------------------------------------------------------------------------
  describe('findById / findByIdOrFail / findOneBy', () => {
    it('findById returns the entity or null', async () => {
      const [id] = await insertItems([{ name: 'alpha', websiteId: 1 }]);

      expect((await repo.findById(id))?.name).toBe('alpha');
      expect(await repo.findById(99999)).toBeNull();
    });

    it('findByIdOrFail throws EntityNotFoundError for a missing id', async () => {
      const [id] = await insertItems([{ name: 'alpha', websiteId: 1 }]);

      await expect(repo.findByIdOrFail(id)).resolves.toMatchObject({ id, name: 'alpha' });
      await expect(repo.findByIdOrFail(99999)).rejects.toThrow(EntityNotFoundError);
    });

    it('findOneBy applies the dynamic filters', async () => {
      await insertItems([
        { name: 'alpha', websiteId: 1 },
        { name: 'beta', websiteId: 2 },
      ]);

      expect((await repo.findOneBy({ name: 'bet' }))?.name).toBe('beta');
      expect((await repo.findOneBy({ websiteId: 1 }))?.name).toBe('alpha');
      expect(await repo.findOneBy({ websiteId: 99 })).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('findMany - filters & sorting', () => {
    let alpha: number, beta: number, gamma: number, alphabet: number;

    beforeEach(async () => {
      [alpha, beta, gamma, alphabet] = await insertItems([
        { name: 'alpha', websiteId: 1 },
        { name: 'beta', websiteId: 1 },
        { name: 'gamma', websiteId: 2 },
        { name: 'alphabet', websiteId: 2 },
      ]);
    });

    it('returns everything (with metadata) when no args are given', async () => {
      const res = await repo.findMany({ sortings: { id: 'ASC' } });

      expect(idsOf(res.data)).toEqual([alpha, beta, gamma, alphabet]);
      expect(res.meta).toEqual({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 4,
        totalPages: 1,
      });
    });

    it('returns paginated results (with metadata) when pagination is specified', async () => {
      const res = await repo.findMany({
        sortings: { id: 'ASC' },
        pagination: { page: 1, limit: 1 },
      });

      expect(idsOf(res.data)).toEqual([alpha]);
      expect(res.meta).toEqual({
        currentPage: 1,
        itemsPerPage: 1,
        totalItems: 4,
        totalPages: 4,
      });
    });

    it('applies the LIKE filter (substring match)', async () => {
      const res = await repo.findMany({ filters: { name: 'alpha' }, sortings: { id: 'ASC' } });
      expect(idsOf(res.data)).toEqual([alpha, alphabet]);
    });

    it('applies the equality filter', async () => {
      const res = await repo.findMany({ filters: { websiteId: 1 }, sortings: { id: 'ASC' } });
      expect(idsOf(res.data)).toEqual([alpha, beta]);
    });

    it('applies the IN filter', async () => {
      const res = await repo.findMany({
        filters: { ids: [beta, gamma] },
        sortings: { id: 'ASC' },
      });
      expect(idsOf(res.data)).toEqual([beta, gamma]);
    });

    it('combines filters with AND', async () => {
      const res = await repo.findMany({ filters: { name: 'alpha', websiteId: 2 } });
      expect(idsOf(res.data)).toEqual([alphabet]);
    });

    it('ignores undefined filter values and unknown filter keys', async () => {
      const res = await repo.findMany({
        filters: { websiteId: undefined, doesNotExist: 123 } as any,
        sortings: { id: 'ASC' },
      });
      expect(idsOf(res.data)).toEqual([alpha, beta, gamma, alphabet]);
    });

    it('treats an empty IN list as "no filter"', async () => {
      const res = await repo.findMany({ filters: { ids: [] }, sortings: { id: 'ASC' } });
      expect(res.data).toHaveLength(4);
    });

    it('sorts ascending and descending', async () => {
      const asc = await repo.findMany({ sortings: { name: 'ASC' } });
      expect(asc.data.map((r) => r.name)).toEqual(['alpha', 'alphabet', 'beta', 'gamma']);

      const desc = await repo.findMany({ sortings: { name: 'DESC' } });
      expect(desc.data.map((r) => r.name)).toEqual(['gamma', 'beta', 'alphabet', 'alpha']);
    });

    it('ignores unknown sort keys', async () => {
      await expect(repo.findMany({ sortings: { nope: 'ASC' } as any })).resolves.toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  describe('findMany - pagination', () => {
    beforeEach(async () => {
      await insertItems(
        Array.from({ length: 12 }, (_, i) => ({
          name: `item_${String(i + 1).padStart(2, '0')}`,
          websiteId: 1,
        })),
      );
    });

    it('returns the requested page and correct metadata', async () => {
      const res = await repo.findMany({
        sortings: { id: 'ASC' },
        pagination: { page: 2, limit: 5 },
      });

      expect(res.data.map((r) => r.name)).toEqual([
        'item_06',
        'item_07',
        'item_08',
        'item_09',
        'item_10',
      ]);
      expect(res.meta).toEqual({
        currentPage: 2,
        itemsPerPage: 5,
        totalItems: 12,
        totalPages: 3,
      });
    });

    it('returns a partial last page', async () => {
      const res = await repo.findMany({
        sortings: { id: 'ASC' },
        pagination: { page: 3, limit: 5 },
      });
      expect(res.data).toHaveLength(2);
    });

    it('returns an empty page beyond the last one, with the real total', async () => {
      const res = await repo.findMany({ pagination: { page: 10, limit: 5 } });
      expect(res.data).toEqual([]);
      expect(res.meta.totalItems).toBe(12);
    });

    it('clamps the limit to PAGINATION_MAX_LIMIT', async () => {
      const res = await limitedRepo.findMany({
        sortings: { id: 'ASC' },
        pagination: { page: 1, limit: 1000 },
      });
      expect(res.data).toHaveLength(5);
    });

    it('clamps page < 1 to the first page and limit < 1 to 1', async () => {
      const res = await repo.findMany({
        sortings: { id: 'ASC' },
        pagination: { page: -3, limit: 0 },
      });
      expect(res.data.map((r) => r.name)).toEqual(['item_01']);
    });

    it('reports the effective (clamped) limit in the metadata', async () => {
      const res = await limitedRepo.findMany({
        sortings: { id: 'ASC' },
        pagination: { page: 1, limit: 1000 },
      });

      expect(res.meta.itemsPerPage).toBe(5);
      expect(res.meta.totalPages).toBe(3); // ceil(12 / 5)
    });
  });

  // -------------------------------------------------------------------------
  describe('findManyByProperties', () => {
    it('returns entities matching partial property filters', async () => {
      await insertItems([
        { name: 'alpha', websiteId: 1 },
        { name: 'beta', websiteId: 1 },
        { name: 'alpha', websiteId: 2 },
      ]);

      const results = await repo.findManyByProperties({ name: 'alpha', websiteId: 1 });

      expect(results).toHaveLength(1);
      expect(results[0].websiteId).toBe(1);
      expect(results[0].name).toBe('alpha');
    });

    it('ignores undefined and null properties gracefully', async () => {
      await insertItems([
        { name: 'alpha', websiteId: 1 },
        { name: 'beta', websiteId: 2 },
      ]);

      const results = await repo.findManyByProperties({ name: undefined, websiteId: null as any });

      expect(results).toHaveLength(2);
    });

    it('returns an empty array when no properties match', async () => {
      const results = await repo.findManyByProperties({ name: 'nonexistent' });
      expect(results).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  describe('findManyProjected', () => {
    it('only selects the projected columns', async () => {
      await insertItems([
        { name: 'alpha', websiteId: 7 },
        { name: 'beta', websiteId: 8 },
      ]);

      const res = await repo.findManyProjected<{ id: number; name: string; websiteId?: number }>(
        { sortings: { id: 'ASC' } },
        ['id', 'name'],
      );

      expect(res.data.map((r) => r.name)).toEqual(['alpha', 'beta']);
      expect(res.data.every((r) => r.websiteId === undefined)).toBe(true);
      expect(res.meta.totalItems).toBe(2);
    });

    it('still applies filters and pagination', async () => {
      await insertItems([
        { name: 'a', websiteId: 1 },
        { name: 'b', websiteId: 1 },
        { name: 'c', websiteId: 2 },
      ]);

      const res = await repo.findManyProjected<{ id: number; name: string }>(
        { filters: { websiteId: 1 }, sortings: { id: 'ASC' }, pagination: { page: 2, limit: 1 } },
        ['id', 'name'],
      );

      expect(res.data.map((r) => r.name)).toEqual(['b']);
      expect(res.meta).toEqual({ currentPage: 2, itemsPerPage: 1, totalItems: 2, totalPages: 2 });
    });

    it('handles empty projection results correctly without crashing', async () => {
      const res = await repo.findManyProjected({ filters: { name: 'nonexistent' } }, [
        'id',
        'name',
      ]);
      expect(res.data).toEqual([]);
      expect(res.meta.totalItems).toBe(0);
      expect(res.meta.totalPages).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('findManyCustom (projection + relation columns)', () => {
    it('left-joins the relation and selects only the requested relation columns', async () => {
      const [alice, bob] = await insertOwners(['Alice', 'Bob']);
      await insertItems([
        { name: 'alpha', websiteId: 1, ownerId: alice },
        { name: 'beta', websiteId: 1, ownerId: bob },
        { name: 'orphan', websiteId: 1, ownerId: null },
      ]);

      const res = await repo.findManyCustom<{
        id: number;
        name: string;
        owner: { id: number; label: string } | null;
      }>({ sortings: { id: 'ASC' } }, ['id', 'name'], {
        owner: [{ field: 'id' }, { field: 'label' }],
      });

      expect(res.data.map((r) => r.name)).toEqual(['alpha', 'beta', 'orphan']);
      expect(res.data[0].owner).toMatchObject({ id: alice, label: 'Alice' });
      expect(res.data[1].owner).toMatchObject({ id: bob, label: 'Bob' });
      expect(res.data[2].owner ?? null).toBeNull();
      expect(res.meta.totalItems).toBe(3);
    });

    it('handles custom relations gracefully when relation table is empty or missing', async () => {
      await insertItems([{ name: 'orphan_item', websiteId: 1, ownerId: null }]);

      const res = await repo.findManyCustom<{ id: number; name: string; owner: any }>(
        { sortings: { id: 'ASC' } },
        ['id', 'name'],
        { owner: [{ field: 'id' }, { field: 'label' }] },
      );

      expect(res.data).toHaveLength(1);
      expect(res.data[0].owner).toBeNull();
    });

    it('supports filters on the root entity together with the relation', async () => {
      const [alice] = await insertOwners(['Alice']);
      await insertItems([
        { name: 'alpha', websiteId: 1, ownerId: alice },
        { name: 'beta', websiteId: 2, ownerId: alice },
      ]);

      const res = await repo.findManyCustom<{ id: number; name: string }>(
        { filters: { websiteId: 2 } },
        ['id', 'name'],
        { owner: [{ field: 'id' }, { field: 'label' }] },
      );

      expect(res.data.map((r) => r.name)).toEqual(['beta']);
    });

    it('skips relations configured with undefined columns', async () => {
      await insertItems([{ name: 'alpha', websiteId: 1 }]);

      const res = await repo.findManyCustom<{ id: number; name: string }>({}, ['id', 'name'], {
        owner: undefined,
      });

      expect(res.data).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  describe('save / saveMany', () => {
    const build = (n: number) =>
      Array.from({ length: n }, (_, i) =>
        repo.getOrmRepository().create({ name: `bulk_${i}`, websiteId: 1 }),
      );

    it('save persists a single entity and returns it with its id', async () => {
      const saved = await repo.save(repo.getOrmRepository().create({ name: 'one', websiteId: 1 }));

      expect(saved.id).toBeGreaterThan(0);
      expect((await repo.findById(saved.id))?.name).toBe('one');
    });

    it('saveMany returns [] for empty / nullish input without touching the DB', async () => {
      expect(await repo.saveMany([])).toEqual([]);
      expect(await repo.saveMany(undefined as any)).toEqual([]);
      expect(await countItems()).toBe(0);
    });

    it('saveMany persists everything across several chunks of 10', async () => {
      const saved = await repo.saveMany(build(25));

      expect(saved).toHaveLength(25);
      expect(new Set(saved.map((s) => s.id)).size).toBe(25);
      expect(await countItems()).toBe(25);
    });

    it('logs and rethrows on failure, leaving earlier chunks committed', async () => {
      const entities = build(25);
      entities[14].websiteId = null as unknown as number;

      await expect(repo.saveMany(entities)).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[TestItem] Failed to save chunk'),
        expect.any(String),
      );
      expect(await countItems()).toBe(10);
    });
  });

  // -------------------------------------------------------------------------
  describe('delete / deleteMany', () => {
    it('delete removes one row by id', async () => {
      const [a, b] = await insertItems([
        { name: 'a', websiteId: 1 },
        { name: 'b', websiteId: 1 },
      ]);

      const res = await repo.delete(a);

      expect(res.affected).toBe(1);
      expect(await repo.findById(a)).toBeNull();
      expect(await repo.findById(b)).not.toBeNull();
    });

    it('delete on a missing id affects nothing', async () => {
      const res = await repo.delete(99999);
      expect(res.affected).toBe(0);
    });

    it('deleteMany removes only the given ids', async () => {
      const [a, b, c] = await insertItems([
        { name: 'a', websiteId: 1 },
        { name: 'b', websiteId: 1 },
        { name: 'c', websiteId: 1 },
      ]);

      const res = await repo.deleteMany([a, c]);

      expect(res.affected).toBe(2);
      expect(idsOf((await repo.findMany({})).data)).toEqual([b]);
    });

    it('deleteMany with an empty list is a no-op', async () => {
      await insertItems([{ name: 'a', websiteId: 1 }]);

      const res = await repo.deleteMany([]);

      expect(res.affected).toBe(0);
      expect(await countItems()).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  describe('rawQuery & getColumnName', () => {
    it('rawQuery runs parameterised SQL', async () => {
      await insertItems([
        { name: 'a', websiteId: 1 },
        { name: 'b', websiteId: 2 },
      ]);

      const rows = await repo.rawQuery(
        'SELECT COUNT(*)::int AS c FROM test_items WHERE website_id = \$1',
        [1],
      );

      expect(rows).toEqual([{ c: 1 }]);
    });

    it('getColumnName maps property names to aliased DB column names', () => {
      expect(repo.columnName('websiteId')).toBe('item.website_id');
      expect(repo.columnName('id')).toBe('item.id');
    });

    it('getColumnName throws for a property that is not on the entity', () => {
      expect(() => repo.columnName('nope' as keyof TestItem)).toThrow(
        '[TestItem] Property "nope" does not exist in the entity.',
      );
    });
  });

  // -------------------------------------------------------------------------
  describe('executeBatchWrite / executeBatchCount', () => {
    it('executeBatchWrite splits items into batches of the given size, in order', async () => {
      const batches: number[][] = [];

      await repo.executeBatchWrite(
        [1, 2, 3, 4, 5, 6, 7],
        async (batch) => {
          batches.push(batch);
        },
        3,
      );

      expect(batches).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });

    it('executeBatchWrite uses DEFAULT_BATCH_SIZE (500) when none is given', async () => {
      const sizes: number[] = [];

      await repo.executeBatchWrite(
        Array.from({ length: 1200 }, (_, i) => i),
        async (batch) => {
          sizes.push(batch.length);
        },
      );

      expect(sizes).toEqual([500, 500, 200]);
    });

    it('executeBatchWrite does nothing for an empty list', async () => {
      const processor = jest.fn();
      await repo.executeBatchWrite([], processor);
      expect(processor).not.toHaveBeenCalled();
    });

    it('executeBatchCount sums the values returned by each batch', async () => {
      const total = await repo.executeBatchCount([1, 2, 3, 4, 5], async (b) => b.length * 10, 2);
      expect(total).toBe(50);
    });

    it('executeBatchCount returns 0 for an empty list', async () => {
      expect(await repo.executeBatchCount([], async () => 1)).toBe(0);
    });

    it('stops at the first failing batch', async () => {
      const seen: number[][] = [];

      await expect(
        repo.executeBatchWrite(
          [1, 2, 3, 4],
          async (batch) => {
            seen.push(batch);
            if (batch[0] === 3) throw new Error('boom');
          },
          2,
        ),
      ).rejects.toThrow('boom');

      expect(seen).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it('handles large batches correctly in executeBatchWrite with custom batch size', async () => {
      const items = Array.from({ length: 55 }, (_, i) => i + 1);
      const processedChunks: number[][] = [];

      await repo.executeBatchWrite(
        items,
        async (batch) => {
          processedChunks.push(batch);
        },
        20,
      );

      expect(processedChunks).toHaveLength(3);
      expect(processedChunks[0]).toHaveLength(20);
      expect(processedChunks[1]).toHaveLength(20);
      expect(processedChunks[2]).toHaveLength(15);
    });
  });

  // -------------------------------------------------------------------------
  describe('validateIdsEntity', () => {
    it('resolves when every id exists', async () => {
      const ids = await insertOwners(['a', 'b', 'c']);
      await expect(repo.validateIdsEntity(TestOwner, ids)).resolves.toBeUndefined();
    });

    it('throws BadRequestException when at least one id does not exist', async () => {
      const ids = await insertOwners(['a', 'b']);

      await expect(repo.validateIdsEntity(TestOwner, [...ids, 99999])).rejects.toThrow(
        BadRequestException,
      );
      await expect(repo.validateIdsEntity(TestOwner, [...ids, 99999])).rejects.toThrow(
        'One or more provided IDs do not exist.',
      );
    });

    it('is a no-op for empty / nullish input', async () => {
      await expect(repo.validateIdsEntity(TestOwner, [])).resolves.toBeUndefined();
      await expect(repo.validateIdsEntity(TestOwner, undefined as any)).resolves.toBeUndefined();
    });

    it('dedupes ids before comparing counts', async () => {
      const [a, b] = await insertOwners(['a', 'b']);
      await expect(repo.validateIdsEntity(TestOwner, [a, a, b, b])).resolves.toBeUndefined();
    });

    it('validates more than one batch (500 ids per batch)', async () => {
      const rows = await dataSource.query(
        `INSERT INTO test_owners (label)
         SELECT 'owner_' || g FROM generate_series(1, 1200) g RETURNING id`,
      );
      const ids: number[] = rows.map((r: { id: number }) => r.id);

      await expect(repo.validateIdsEntity(TestOwner, ids)).resolves.toBeUndefined();
    });

    it('detects a missing id that lands in a later batch', async () => {
      const rows = await dataSource.query(
        `INSERT INTO test_owners (label)
         SELECT 'owner_' || g FROM generate_series(1, 1200) g RETURNING id`,
      );
      const ids: number[] = rows.map((r: { id: number }) => r.id);

      await expect(repo.validateIdsEntity(TestOwner, [...ids, 999999])).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // -------------------------------------------------------------------------
  describe('Repository Stress & Extreme Edge Cases', () => {
    it('should handle malicious or extreme pagination parameters safely', async () => {
      await insertItems([
        { name: 'item_1', websiteId: 1 },
        { name: 'item_2', websiteId: 1 },
      ]);

      const res = await repo.findMany({
        pagination: { page: Number.MAX_SAFE_INTEGER, limit: -9999 as any },
      });

      expect(res.data).toEqual([]);
      expect(res.meta.currentPage).toBe(Number.MAX_SAFE_INTEGER);
      expect(res.meta.itemsPerPage).toBe(1);
    });
    it('ignores properties that are not valid entity columns', async () => {
      await insertItems([{ name: 'alpha', websiteId: 1 }]);

      // 'invalidProperty' não existe na entidade TestItem, deve ser ignorado sem lançar erro
      const results = await repo.findManyByProperties({
        name: 'alpha',
        invalidProperty: 'hack' as any,
      } as any);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('alpha');
    });
    it('catches database errors, logs them via AppLoggerService, and rethrows', async () => {
      const badEntities = [
        repo.getOrmRepository().create({ name: 'fail', websiteId: null as any }),
      ];

      await expect(repo.saveMany(badEntities)).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[TestItem] Failed to save chunk'),
        expect.any(String),
      );
    });
    it('throws an error when attempting to resolve a non-existent property column name', () => {
      expect(() => repo.columnName('nonExistentProp' as any)).toThrow(
        '[TestItem] Property "nonExistentProp" does not exist in the entity.',
      );
    });
  });
  describe('findMany - Pagination Fallbacks & Boundary Branches', () => {
    it('applies default pagination values (page 1, limit 10) when pagination object is omitted', async () => {
      await insertItems(
        Array.from({ length: 15 }, (_, i) => ({
          name: `item_${i}`,
          websiteId: 1,
        })),
      );

      const res = await repo.findMany({ sortings: { id: 'ASC' } });

      expect(res.data).toHaveLength(10); // Default limit 10
      expect(res.meta).toEqual({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 15,
        totalPages: 2,
      });
    });

    it('handles custom pagination limits correctly when limit is within bounds', async () => {
      await insertItems([{ name: 'a', websiteId: 1 }]);

      const res = await repo.findMany({
        pagination: { limit: 5 }, // page omitted -> defaults to 1
      });

      expect(res.meta.currentPage).toBe(1);
      expect(res.meta.itemsPerPage).toBe(5);
    });
    describe('exists / existsOrFail', () => {
      it('returns true if an entity matches the filters, false otherwise', async () => {
        await insertItems([{ name: 'alpha', websiteId: 1 }]);

        expect(await repo.exists({ name: 'alpha' } as any)).toBe(true);
        expect(await repo.exists({ name: 'nonexistent' } as any)).toBe(false);
      });

      it('existsOrFail resolves successfully when entity exists', async () => {
        await insertItems([{ name: 'alpha', websiteId: 1 }]);

        await expect(repo.existsOrFail({ name: 'alpha' } as any)).resolves.toBeUndefined();
      });

      it('existsOrFail throws EntityNotFoundError or custom exception when entity does not exist', async () => {
        // 1. Testa EntityNotFoundError por defeito
        await expect(repo.existsOrFail({ name: 'missing' } as any)).rejects.toThrow(
          EntityNotFoundError,
        );

        // 2. Testa exceção customizada fornecida como argumento
        const customErr = new BadRequestException('Custom item not found');
        await expect(repo.existsOrFail({ name: 'missing' } as any, customErr)).rejects.toThrow(
          'Custom item not found',
        );
      });
    });
    describe('exists / existsOrFail', () => {
      it('returns true if an entity matches the filters, false otherwise', async () => {
        await insertItems([{ name: 'alpha', websiteId: 1 }]);

        expect(await repo.exists({ name: 'alpha' } as any)).toBe(true);
        expect(await repo.exists({ name: 'nonexistent' } as any)).toBe(false);
      });

      it('existsOrFail resolves successfully when entity exists', async () => {
        await insertItems([{ name: 'alpha', websiteId: 1 }]);

        await expect(repo.existsOrFail({ name: 'alpha' } as any)).resolves.toBeUndefined();
      });

      it('existsOrFail throws EntityNotFoundError or custom exception when entity does not exist', async () => {
        // 1. Testa EntityNotFoundError por defeito
        await expect(repo.existsOrFail({ name: 'missing' } as any)).rejects.toThrow(
          EntityNotFoundError,
        );

        // 2. Testa exceção customizada fornecida como argumento
        const customErr = new BadRequestException('Custom item not found');
        await expect(repo.existsOrFail({ name: 'missing' } as any, customErr)).rejects.toThrow(
          'Custom item not found',
        );
      });
    });
    describe('softDelete / restore', () => {
      it('soft deletes and restores an entity by id', async () => {
        const [id] = await insertSoftDeletableEntities([{ name: 'test1' }]);

        // Soft delete
        const deleteRes = await softDeletableRepo.softDelete(id);
        expect(deleteRes.affected).toBe(1);

        // Usar o softDeletableRepo para verificar que o registo está oculto
        expect(await softDeletableRepo.findById(id)).toBeNull();

        // Restore
        const restoreRes = await softDeletableRepo.restore(id);
        expect(restoreRes.affected).toBe(1);

        // Deve voltar a aparecer no repositório correto
        expect(await softDeletableRepo.findById(id)).not.toBeNull();
      });
      it('soft deletes and restores multiple entities by ids', async () => {
        const ids = await insertSoftDeletableEntities([
          { name: 'deletable1' },
          { name: 'deletable2' },
        ]);

        // Soft delete
        const deleteRes = await softDeletableRepo.softDeleteMany(ids);
        expect(deleteRes.affected).toBe(2);

        // O findById por defeito no TypeORM ignora registos soft-deleted
        for (const id of ids) {
          expect(await softDeletableRepo.findById(id)).toBeNull();
        }

        // Restore
        const restoreRes = await softDeletableRepo.restoreMany(ids);
        expect(restoreRes.affected).toBe(2);

        // Deve voltar a aparecer
        for (const id of ids) {
          expect(await softDeletableRepo.findById(id)).not.toBeNull();
        }
      });
      it('Should throw an error on soft delete when entity does not have a soft delete column', async () => {
        const [id] = await insertItems([{ name: 'alpha', websiteId: 1 }]);

        // Soft delete
        await expect(repo.softDelete(id)).rejects.toThrow(
          'Entity does not have a soft delete column.',
        );

        await expect(repo.restore(id)).rejects.toThrow(
          'Entity does not have a soft delete column.',
        );
      });
    });
  });
});
