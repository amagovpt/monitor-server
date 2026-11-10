import * as path from 'path';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { DataSource, Repository } from 'typeorm';

import { User } from 'src/domains/identity/user/user.entity';
import { Evaluation, PublishStatus } from './entities/evaluation.entity';
import { createSchemaSeeder } from './evaluation.seeder';

describe('Evaluation entity mapping (Testcontainers + Postgres)', () => {
  let container: StartedTestContainer;
  let dataSource: DataSource;
  let repo: Repository<Evaluation>;

  const seeder = createSchemaSeeder(() => dataSource);
  const { make, metaOf } = seeder;

  const pageMeta = () =>
    dataSource.getMetadata(Evaluation).findRelationWithPropertyPath('page')!.inverseEntityMetadata;
  const websiteMeta = () =>
    pageMeta().findRelationWithPropertyPath('website')!.inverseEntityMetadata;

  const makePage = async () => make(pageMeta(), { website: await make(websiteMeta()) });
  const makeUser = (username: string) => make(User, { username });

  /** inserts only what the test states; everything else is left to the schema defaults */
  const insertEvaluation = async (values: Record<string, any>): Promise<Evaluation> => {
    const res = await repo.insert(values as any);
    return repo.findOneByOrFail({ id: res.identifiers[0].id });
  };

  const rawRow = async (id: number) =>
    (await dataSource.query('SELECT * FROM evaluations WHERE id = $1', [id]))[0];

  beforeAll(async () => {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({ POSTGRES_USER: 'test', POSTGRES_PASSWORD: 'test', POSTGRES_DB: 'test' })
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
      entities: [path.join(process.cwd(), 'src/**/*.entity{.ts,.js}')],
      synchronize: true,
    });
    await dataSource.initialize();
    repo = dataSource.getRepository(Evaluation);
  }, 180000);

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (container) await container.stop();
  });

  beforeEach(async () => {
    await dataSource.query(
      `TRUNCATE "${websiteMeta().tableName}", "users" RESTART IDENTITY CASCADE`,
    );
  });

  // =========================================================================
  describe('schema', () => {
    it("maps to the 'evaluations' table", () => {
      expect(dataSource.getMetadata(Evaluation).tableName).toBe('evaluations');
    });

    it('stores the publish status as a Postgres enum with exactly the PublishStatus values', async () => {
      const rows = await dataSource.query(
        `SELECT e.enumlabel FROM pg_enum e
           JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'evaluations_publish_status_enum'
          ORDER BY e.enumsortorder`,
      );

      expect(rows.map((r: { enumlabel: string }) => r.enumlabel).sort()).toEqual([
        'PUBLISHED',
        'STAGED',
      ]);
    });

    it('has an index on (page_id, created_at) for "newest evaluation of a page" lookups', async () => {
      const [row] = await dataSource.query(
        `SELECT indexdef FROM pg_indexes
          WHERE tablename = 'evaluations' AND indexname = 'idx_evaluations_page_created'`,
      );

      expect(row).toBeDefined();
      expect(row.indexdef).toMatch(/\(page_id, created_at\)/);
    });

    it('has an index on created_by_id', async () => {
      const rows = await dataSource.query(
        `SELECT indexdef FROM pg_indexes WHERE tablename = 'evaluations'`,
      );

      expect(rows.some((r: { indexdef: string }) => /\(created_by_id\)/.test(r.indexdef))).toBe(
        true,
      );
    });
  });

  // =========================================================================
  describe('defaults and required fields', () => {
    it('only needs a page: everything else is optional', async () => {
      const page = await makePage();

      const ev = await insertEvaluation({ pageId: page.id });

      expect(ev.pageId).toBe(page.id);
      expect(ev.pageTitle).toBeNull();
      expect(ev.score).toBeNull();
      expect(ev.A).toBeNull();
      expect(ev.AA).toBeNull();
      expect(ev.AAA).toBeNull();
      expect(ev.tagCount).toBeNull();
      expect(ev.evaluationDate).toBeNull();
      expect(ev.frozenAt).toBeNull();
      expect(ev.createdById).toBeNull();
      expect(ev.updatedById).toBeNull();
    });

    it('rejects an evaluation without a page', async () => {
      await expect(insertEvaluation({ pageTitle: 'orphan' })).rejects.toThrow(/page_id/);
    });

    it('rejects an evaluation for a page that does not exist', async () => {
      await expect(insertEvaluation({ pageId: 999999 })).rejects.toThrow(/foreign key/i);
    });

    it('starts as STAGED', async () => {
      const page = await makePage();

      const ev = await insertEvaluation({ pageId: page.id });

      expect(ev.status).toBe(PublishStatus.STAGED);
    });

    it('accepts both publish statuses and rejects anything else', async () => {
      const page = await makePage();

      const staged = await insertEvaluation({ pageId: page.id, status: PublishStatus.STAGED });
      const published = await insertEvaluation({
        pageId: page.id,
        status: PublishStatus.PUBLISHED,
      });
      expect(staged.status).toBe('STAGED');
      expect(published.status).toBe('PUBLISHED');

      await expect(
        insertEvaluation({ pageId: page.id, status: 'ARCHIVED' as unknown as PublishStatus }),
      ).rejects.toThrow(/enum/i);
    });

    it('generates increasing ids but also accepts explicit ones (identity BY DEFAULT)', async () => {
      const page = await makePage();

      const a = await insertEvaluation({ pageId: page.id });
      const b = await insertEvaluation({ pageId: page.id });
      const explicit = await insertEvaluation({ id: 5000, pageId: page.id });

      expect(b.id).toBeGreaterThan(a.id);
      expect(explicit.id).toBe(5000);
    });
  });

  // =========================================================================
  describe('score, A, AA, AAA, tagCount', () => {
    it('keeps the score as a string with one decimal', async () => {
      const page = await makePage();

      const ev = await insertEvaluation({ pageId: page.id, score: '7.5' });

      expect(ev.score).toBe('7.5');
      expect(typeof ev.score).toBe('string');
    });

    it('pads a whole score to one decimal', async () => {
      const page = await makePage();

      expect((await insertEvaluation({ pageId: page.id, score: '8' })).score).toBe('8.0');
    });

    it('rounds a score with more than one decimal to one decimal', async () => {
      const page = await makePage();

      expect((await insertEvaluation({ pageId: page.id, score: '7.46' })).score).toBe('7.5');
      expect((await insertEvaluation({ pageId: page.id, score: '7.44' })).score).toBe('7.4');
    });

    it('accepts the whole 0.0 to 10.0 range', async () => {
      const page = await makePage();

      expect((await insertEvaluation({ pageId: page.id, score: '0.0' })).score).toBe('0.0');
      expect((await insertEvaluation({ pageId: page.id, score: '10.0' })).score).toBe('10.0');
    });

    it('stores the A / AA / AAA / tag counts as integers, including zero', async () => {
      const page = await makePage();

      const ev = await insertEvaluation({
        pageId: page.id,
        A: 12,
        AA: 0,
        AAA: 3,
        tagCount: 150,
      });

      expect([ev.A, ev.AA, ev.AAA, ev.tagCount]).toEqual([12, 0, 3, 150]);
    });

    it('maps score / tagCount / pageTitle to snake_case columns', async () => {
      const page = await makePage();
      const ev = await insertEvaluation({
        pageId: page.id,
        score: '6.5',
        tagCount: 9,
        pageTitle: 'Home',
      });

      const raw = await rawRow(ev.id);

      expect(raw).toMatchObject({ page_id: page.id, page_title: 'Home', tag_count: 9 });
      expect(Number(raw.score)).toBe(6.5);
    });
  });

  // =========================================================================
  describe('timestamps', () => {
    it('sets created_at and updated_at automatically on insert', async () => {
      const page = await makePage();
      const before = Date.now() - 5000;

      const ev = await insertEvaluation({ pageId: page.id });

      expect(ev.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(ev.createdAt.getTime()).toBeLessThanOrEqual(Date.now() + 5000);
      expect(ev.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('keeps an explicit createdAt', async () => {
      const page = await makePage();
      const when = new Date('2025-06-15T08:30:00.000Z');

      const ev = await insertEvaluation({ pageId: page.id, createdAt: when });

      expect(ev.createdAt.toISOString()).toBe(when.toISOString());
    });

    it('stores evaluationDate and frozenAt as exact instants', async () => {
      const page = await makePage();
      const evaluationDate = new Date('2026-03-04T05:06:07.123Z');
      const frozenAt = new Date('2026-03-05T10:00:00.000Z');

      const ev = await insertEvaluation({ pageId: page.id, evaluationDate, frozenAt });

      expect(ev.evaluationDate.toISOString()).toBe(evaluationDate.toISOString());
      expect(ev.frozenAt!.toISOString()).toBe(frozenAt.toISOString());
    });
  });

  // =========================================================================
  describe('isFrozen on persisted evaluations', () => {
    it('is false for an evaluation loaded from the database with no frozenAt', async () => {
      const page = await makePage();
      const ev = await insertEvaluation({ pageId: page.id });

      expect(ev.isFrozen).toBe(false);
    });

    it('is true after freezing and false after unfreezing', async () => {
      const page = await makePage();
      const ev = await insertEvaluation({ pageId: page.id });

      await repo.update(ev.id, { frozenAt: new Date() });
      expect((await repo.findOneByOrFail({ id: ev.id })).isFrozen).toBe(true);

      await repo.update(ev.id, { frozenAt: null });
      expect((await repo.findOneByOrFail({ id: ev.id })).isFrozen).toBe(false);
    });

    it('is false for an evaluation that has just been created in memory and saved', async () => {
      const page = await makePage();
      const fresh = repo.create({ pageId: page.id });

      const saved = await repo.save(fresh);

      expect(saved.isFrozen).toBe(false);
    });
  });

  // =========================================================================
  describe('relations', () => {
    it('loads its page', async () => {
      const page = await makePage();
      const ev = await insertEvaluation({ pageId: page.id });

      const loaded = await repo.findOneOrFail({ where: { id: ev.id }, relations: ['page'] });

      expect(loaded.page.id).toBe(page.id);
    });

    it('is deleted together with its page (ON DELETE CASCADE) and only then', async () => {
      const [p1, p2] = [await makePage(), await makePage()];
      const e1 = await insertEvaluation({ pageId: p1.id });
      const e2 = await insertEvaluation({ pageId: p1.id });
      const keep = await insertEvaluation({ pageId: p2.id });

      await dataSource.getRepository(pageMeta().target as any).delete(p1.id);

      expect(await repo.findOneBy({ id: e1.id })).toBeNull();
      expect(await repo.findOneBy({ id: e2.id })).toBeNull();
      expect(await repo.findOneBy({ id: keep.id })).not.toBeNull();
    });

    it('records who created and who last updated it', async () => {
      const page = await makePage();
      const [creator, editor] = [await makeUser('creator'), await makeUser('editor')];

      const ev = await insertEvaluation({
        pageId: page.id,
        createdById: creator.id,
        updatedById: editor.id,
      });

      const loaded = await repo.findOneOrFail({
        where: { id: ev.id },
        relations: ['createdBy', 'updatedBy'],
      });
      expect(loaded.createdBy.username).toBe('creator');
      expect(loaded.updatedBy!.username).toBe('editor');
    });

    it('rejects a creator that is not a user', async () => {
      const page = await makePage();

      await expect(insertEvaluation({ pageId: page.id, createdById: 999999 })).rejects.toThrow(
        /foreign key/i,
      );
    });

    it('allows an evaluation with no creator and no editor', async () => {
      const page = await makePage();

      const loaded = await repo.findOneOrFail({
        where: { id: (await insertEvaluation({ pageId: page.id })).id },
        relations: ['createdBy', 'updatedBy'],
      });

      expect(loaded.createdBy).toBeNull();
      expect(loaded.updatedBy).toBeNull();
    });
  });
});
