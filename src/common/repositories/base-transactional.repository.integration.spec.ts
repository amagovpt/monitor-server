import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { Column, DataSource, Entity, PrimaryGeneratedColumn, QueryRunner } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { AppLoggerService } from '@core/app-logger/app-logger.service';
import { BaseTransactionalRepository } from './base-transactional.repository';
import { FilterMap, SortingMap } from './base.repository';
import { BaseFilter, BaseSort } from '../interfaces/types';

// ---------------------------------------------------------------------------
// Test entity + concrete repository
// ---------------------------------------------------------------------------
@Entity('test_rows')
class TestRow {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'text' }) label!: string;
}

class TestRowRepository extends BaseTransactionalRepository<TestRow> {
  protected readonly alias = 'row';
  protected readonly filterMap = {} as unknown as FilterMap<BaseFilter, TestRow>;
  protected readonly sortMap = {} as unknown as SortingMap<BaseSort, TestRow>;

  constructor(dataSource: DataSource, logger: AppLoggerService, config: ConfigService) {
    super(dataSource.getRepository(TestRow), logger, config);
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

describe('BaseTransactionalRepository Integration (Testcontainers + Postgres)', () => {
  let container: StartedTestContainer;
  let dataSource: DataSource;
  let repo: TestRowRepository;

  const logger = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  } as unknown as AppLoggerService;
  const config = { get: jest.fn((_key: string, def: unknown) => def) } as unknown as ConfigService;

  async function countRows(): Promise<number> {
    const [{ count }] = await dataSource.query('SELECT COUNT(*)::int AS count FROM test_rows');
    return count;
  }

  async function labels(): Promise<string[]> {
    const rows = await dataSource.query('SELECT label FROM test_rows ORDER BY label');
    return rows.map((r: { label: string }) => r.label);
  }

  /** Records every QueryRunner the repository creates so we can inspect it afterwards. */
  function trackRunners(): QueryRunner[] {
    const runners: QueryRunner[] = [];
    const original = dataSource.createQueryRunner.bind(dataSource);
    jest
      .spyOn(dataSource, 'createQueryRunner')
      .mockImplementation((...args: Parameters<DataSource['createQueryRunner']>) => {
        const qr = original(...args);
        runners.push(qr);
        return qr;
      });
    return runners;
  }

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
      entities: [TestRow],
      synchronize: false,
    });
    await dataSource.initialize();

    await dataSource.query(`
      CREATE TABLE test_rows (
        id    SERIAL PRIMARY KEY,
        label TEXT NOT NULL
      );
    `);

    repo = new TestRowRepository(dataSource, logger, config);
  }, 120000);

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (container) await container.stop();
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE test_rows RESTART IDENTITY');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  describe('constructor', () => {
    it('takes the DataSource from the repository manager connection', () => {
      expect(repo.getDataSource()).toBe(dataSource);
    });
  });

  // -------------------------------------------------------------------------
  describe('commit path', () => {
    it('commits the work and returns the value produced by the operation', async () => {
      const result = await repo.runInTransaction(async (qr) => {
        await qr.query(`INSERT INTO test_rows (label) VALUES ('a'), ('b')`);
        return 42;
      });

      expect(result).toBe(42);
      expect(await labels()).toEqual(['a', 'b']);
    });

    it('works with the QueryRunner manager (entities) too', async () => {
      await repo.runInTransaction(async (qr) => {
        await qr.manager.getRepository(TestRow).insert({ label: 'via manager' });
      });

      expect(await labels()).toEqual(['via manager']);
    });

    it('has an active transaction inside the operation and none afterwards', async () => {
      const runners = trackRunners();
      let activeInside: boolean | undefined;

      await repo.runInTransaction(async (qr) => {
        activeInside = qr.isTransactionActive;
      });

      expect(activeInside).toBe(true);
      expect(runners).toHaveLength(1);
      expect(runners[0].isTransactionActive).toBe(false);
    });

    it('releases the QueryRunner after a successful run', async () => {
      const runners = trackRunners();

      await repo.runInTransaction(async () => undefined);

      expect(runners[0].isReleased).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('rollback path', () => {
    it('rolls back everything and rethrows the very same error', async () => {
      const boom = new Error('boom');

      const promise = repo.runInTransaction(async (qr) => {
        await qr.query(`INSERT INTO test_rows (label) VALUES ('a')`);
        await qr.query(`INSERT INTO test_rows (label) VALUES ('b')`);
        throw boom;
      });

      await expect(promise).rejects.toBe(boom);
      expect(await countRows()).toBe(0);
    });

    it('rolls back earlier statements when a later one fails in the database', async () => {
      await expect(
        repo.runInTransaction(async (qr) => {
          await qr.query(`INSERT INTO test_rows (label) VALUES ('ok')`);
          await qr.query(`INSERT INTO test_rows (label) VALUES (NULL)`); // NOT NULL violation
        }),
      ).rejects.toThrow(/null value in column "label"/);

      expect(await countRows()).toBe(0);
    });

    it('rolls back work done through the entity manager', async () => {
      await expect(
        repo.runInTransaction(async (qr) => {
          await qr.manager.getRepository(TestRow).insert({ label: 'gone' });
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      expect(await countRows()).toBe(0);
    });

    it('releases the QueryRunner after a failure', async () => {
      const runners = trackRunners();

      await expect(
        repo.runInTransaction(async () => {
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      expect(runners[0].isReleased).toBe(true);
      expect(runners[0].isTransactionActive).toBe(false);
    });

    it('does not leak connections: more failures than the pool size still leaves the pool usable', async () => {
      // pg pool defaults to 10 connections. If release() were skipped, the 11th call would hang.
      for (let i = 0; i < 30; i++) {
        await expect(
          repo.runInTransaction(async () => {
            throw new Error(`fail ${i}`);
          }),
        ).rejects.toThrow(`fail ${i}`);
      }

      await expect(
        repo.runInTransaction(async (qr) => qr.query('SELECT 1 AS ok')),
      ).resolves.toEqual([{ ok: 1 }]);
    }, 30000);

    // Characterization: if rollbackTransaction() itself throws, the catch block propagates the
    // rollback error and the original error from the operation is lost. The finally block still
    // releases the runner. Consider logging the original error before rolling back.
    it('masks the original error when the rollback itself fails (but still releases)', async () => {
      const runners = trackRunners();

      const promise = repo.runInTransaction(async (qr) => {
        const realRollback = qr.rollbackTransaction.bind(qr);
        jest.spyOn(qr, 'rollbackTransaction').mockImplementationOnce(async () => {
          await realRollback(); // really close the transaction so the pooled connection stays clean
          throw new Error('rollback failed');
        });
        throw new Error('original');
      });

      await expect(promise).rejects.toThrow('rollback failed');
      expect(runners[0].isReleased).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('isolation levels', () => {
    it("defaults to 'READ COMMITTED'", async () => {
      const [{ transaction_isolation }] = await repo.runInTransaction((qr) =>
        qr.query('SHOW transaction_isolation'),
      );

      expect(transaction_isolation).toBe('read committed');
    });

    it.each([
      ['REPEATABLE READ', 'repeatable read'],
      ['SERIALIZABLE', 'serializable'],
      ['READ COMMITTED', 'read committed'],
    ] as const)('applies the requested level (%s)', async (level, expected) => {
      const [{ transaction_isolation }] = await repo.runInTransaction(
        (qr) => qr.query('SHOW transaction_isolation'),
        level,
      );

      expect(transaction_isolation).toBe(expected);
    });

    /** Reads the table twice inside one transaction, with an outside commit in between. */
    async function readTwiceAroundOutsideInsert(
      level: 'READ COMMITTED' | 'REPEATABLE READ',
    ): Promise<[number, number]> {
      const firstReadDone = deferred();
      const outsideDone = deferred();

      const tx = repo.runInTransaction(async (qr): Promise<[number, number]> => {
        const [{ c: before }] = await qr.query('SELECT COUNT(*)::int AS c FROM test_rows');
        firstReadDone.resolve();
        await outsideDone.promise;
        const [{ c: after }] = await qr.query('SELECT COUNT(*)::int AS c FROM test_rows');
        return [before, after];
      }, level);

      await firstReadDone.promise;
      await dataSource.query(`INSERT INTO test_rows (label) VALUES ('committed outside')`);
      outsideDone.resolve();

      return tx;
    }

    it('READ COMMITTED sees rows committed by others mid-transaction', async () => {
      expect(await readTwiceAroundOutsideInsert('READ COMMITTED')).toEqual([0, 1]);
    });

    it('REPEATABLE READ keeps a stable snapshot for the whole transaction', async () => {
      expect(await readTwiceAroundOutsideInsert('REPEATABLE READ')).toEqual([0, 0]);
    });
  });

  // -------------------------------------------------------------------------
  describe('isolation from other connections', () => {
    it('keeps uncommitted writes invisible outside until the commit', async () => {
      const inserted = deferred();
      const gate = deferred();

      const tx = repo.runInTransaction(async (qr) => {
        await qr.query(`INSERT INTO test_rows (label) VALUES ('pending')`);
        inserted.resolve();
        await gate.promise;
      });

      await inserted.promise;
      expect(await countRows()).toBe(0); // not committed yet

      gate.resolve();
      await tx;

      expect(await countRows()).toBe(1);
    });

    it('never exposes rolled-back writes to other connections', async () => {
      const inserted = deferred();
      const gate = deferred();

      const tx = repo.runInTransaction(async (qr) => {
        await qr.query(`INSERT INTO test_rows (label) VALUES ('pending')`);
        inserted.resolve();
        await gate.promise;
        throw new Error('abort');
      });
      const settled = tx.catch((e) => e);

      await inserted.promise;
      expect(await countRows()).toBe(0);

      gate.resolve();
      expect(((await settled) as Error).message).toBe('abort');
      expect(await countRows()).toBe(0);
    });

    it('runs concurrent transactions independently (one failing does not affect the others)', async () => {
      const results = await Promise.allSettled(
        [0, 1, 2, 3, 4].map((i) =>
          repo.runInTransaction(async (qr) => {
            await qr.query('INSERT INTO test_rows (label) VALUES ($1)', [`row_${i}`]);
            if (i === 2) throw new Error('fail 2');
            return i;
          }),
        ),
      );

      expect(results.map((r) => r.status)).toEqual([
        'fulfilled',
        'fulfilled',
        'rejected',
        'fulfilled',
        'fulfilled',
      ]);
      expect(await labels()).toEqual(['row_0', 'row_1', 'row_3', 'row_4']);
    });
  });
});
