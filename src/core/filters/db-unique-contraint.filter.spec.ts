import { Body, Controller, Inject, INestApplication, Logger, Post } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { DbConstraintExceptionFilter } from './db-unique-contraint.filter';

jest.mock('./db-unique-constraints.type', () => ({
  DbUniqueConstraint: { EMAIL: 'email' },
  UNIQUE_CONSTRAINT_MAPPINGS: {
    email: { property: 'email', message: 'Email already in use' },
  },
}));

// Test controller: runs raw SQL to trigger real Postgres errors
@Controller('test-db')
class TestDbController {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  @Post('exec')
  async exec(@Body() body: { sql: string; params?: unknown[] }) {
    await this.dataSource.query(body.sql, body.params);
    return { ok: true };
  }
}

describe('DbConstraintExceptionFilter (Postgres + Testcontainers)', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let app: INestApplication;

  const exec = (sql: string, params: unknown[] = []) =>
    request(app.getHttpServer()).post('/test-db/exec').send({ sql, params });

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();

    dataSource = new DataSource({
      type: 'postgres',
      url: container.getConnectionUri(),
      entities: [],
      synchronize: false,
    });
    await dataSource.initialize();

    await dataSource.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        age INT CHECK (age >= 0)
      )
    `);
    await dataSource.query(`
      CREATE TABLE posts (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id),
        title TEXT
      )
    `);

    const moduleRef = await Test.createTestingModule({
      controllers: [TestDbController],
      providers: [
        { provide: DataSource, useValue: dataSource },
        { provide: APP_FILTER, useClass: DbConstraintExceptionFilter },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    await container?.stop();
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE posts, users RESTART IDENTITY CASCADE');
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 409 with the constraint mapping on UNIQUE violations', async () => {
    await exec('INSERT INTO users (email) VALUES ($1)', ['a@a.com']).expect(201);

    const res = await exec('INSERT INTO users (email) VALUES ($1)', ['a@a.com']).expect(409);

    expect(res.body).toEqual({
      statusCode: 409,
      error: 'Conflict',
      message: 'Duplicate key value violates unique constraint',
      errors: { email: 'Email already in use' },
    });
  });

  it('returns 400 with the constraint name on FOREIGN KEY violations', async () => {
    const res = await exec('INSERT INTO posts (user_id, title) VALUES ($1, $2)', [
      999,
      'orphan',
    ]).expect(400);

    expect(res.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'A referenced entity (foreign key) does not exist or cannot be modified.',
      constraint: 'posts_user_id_fkey',
    });
  });

  it('returns 400 on NOT NULL violations and reports the column', async () => {
    const res = await exec('INSERT INTO users (email) VALUES (NULL)').expect(400);

    expect(res.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid data for database operation.',
      column: 'email',
    });
  });

  it('returns 400 on CHECK violations and reports the constraint', async () => {
    const res = await exec('INSERT INTO users (email, age) VALUES ($1, $2)', [
      'b@b.com',
      -1,
    ]).expect(400);

    expect(res.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid data for database operation.',
      constraint: 'users_age_check',
    });
  });

  it('returns 400 on invalid text representation (22P02)', async () => {
    const res = await exec("SELECT 'abc'::int").expect(400);

    expect(res.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid data for database operation.',
    });
  });

  it('returns 500 and logs unhandled database errors', async () => {
    const loggerSpy = jest.spyOn(Logger.prototype, 'error');

    const res = await exec('SELECT * FROM table_that_does_not_exist').expect(500);

    expect(res.body).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unhandled database error (code: 42P01)'),
      expect.any(String),
    );
  });
});
