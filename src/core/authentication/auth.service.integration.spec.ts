import * as http from 'http';
import { AddressInfo } from 'net';
import * as crypto from 'crypto';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import Redis from 'ioredis';
import {
  Column,
  DataSource,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Repository,
} from 'typeorm';
import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthService, JWTTokenPayload } from './auth.service';
import { jwtConstants, NAME_CONVERTER } from './constants/constants';

/**
 * Password hashing is a collaborator with its own tests, so it is replaced by a trivial,
 * deterministic scheme: the stored "hash" of a password is `hashed:<password>`.
 */
jest.mock('../../common/security', () => ({
  comparePasswordHash: jest.fn(async (plain: string, hash: string) => hash === `hashed:${plain}`),
}));

// ---------------------------------------------------------------------------
// Test entities (same column shape the service relies on)
// ---------------------------------------------------------------------------
@Entity('test_roles')
class TestRole {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'text' }) slug!: string;
}

@Entity('test_users')
class TestUser {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'text' }) username!: string;
  @Column({ type: 'text' }) password!: string;

  @ManyToOne(() => TestRole, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role!: TestRole | null;

  @Column({ name: 'unique_hash', type: 'text', nullable: true }) uniqueHash!: string | null;
  @Column({ name: 'created_at', type: 'timestamp', default: () => 'now()' }) createdAt!: Date;
  @Column({ name: 'last_login', type: 'timestamp', nullable: true }) lastLogin!: Date | null;
  @Column({ name: 'cc_number', type: 'text', nullable: true }) ccNumber!: string | null;
}

// ---------------------------------------------------------------------------
// Fake external identity provider (AUTH_SERVER) used by getAtributes / verifyLoginUser
// ---------------------------------------------------------------------------
interface RecordedRequest {
  method: string;
  url: string;
  body: any;
}

const ATTR_NIC = 'http://interop.gov.pt/MDC/Cidadao/NIC';
const ATTR_NAME = 'http://interop.gov.pt/MDC/Cidadao/NomeCompleto';

describe('AuthService Integration (Testcontainers Postgres + Redis, real JWT)', () => {
  let pgContainer: StartedTestContainer;
  let redisContainer: StartedTestContainer;
  let dataSource: DataSource;
  let redis: Redis;
  let authServer: http.Server;

  let userRepo: Repository<TestUser>;
  let jwt: JwtService;
  let service: AuthService;

  const config: Record<string, string | undefined> = {};
  const configService = { get: jest.fn((key: string) => config[key]) };
  const fga = { getAuthorizationLevel: jest.fn() };
  const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn(), debug: jest.fn() };

  // what the fake identity provider will answer
  let providerAttributes: Array<{ name: string; value: string }> = [];
  let providerContextId = 'ctx-123';
  let recorded: RecordedRequest[] = [];

  // attribute names as the application maps them (NAME_CONVERTER: provider attr name -> field)
  const attrNameFor = (field: string, fallback: string) =>
    Object.entries(NAME_CONVERTER as Record<string, string>).find(([, v]) => v === field)?.[0] ??
    fallback;
  const CC_ATTR = attrNameFor('cc', ATTR_NIC);
  const NAME_ATTR = attrNameFor('name', ATTR_NAME);

  // ---- DB helpers ---------------------------------------------------------
  async function insertRole(slug: string): Promise<number> {
    const [{ id }] = await dataSource.query(
      'INSERT INTO test_roles (slug) VALUES ($1) RETURNING id',
      [slug],
    );
    return id;
  }

  async function insertUser(opts: {
    username: string;
    password?: string; // plain; stored as `hashed:<plain>`
    roleId?: number | null;
    uniqueHash?: string | null;
    ccNumber?: string | null;
  }): Promise<number> {
    const [{ id }] = await dataSource.query(
      `INSERT INTO test_users (username, password, role_id, unique_hash, cc_number)
        VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        opts.username,
        `hashed:${opts.password ?? 'secret'}`,
        opts.roleId ?? null,
        opts.uniqueHash === undefined ? `hash-${opts.username}` : opts.uniqueHash,
        opts.ccNumber ?? null,
      ],
    );
    return id;
  }

  async function lastLoginOf(userId: number): Promise<string | null> {
    const [row] = await dataSource.query(
      `SELECT to_char(last_login, 'YYYY-MM-DD HH24:MI:SS') AS ll FROM test_users WHERE id = $1`,
      [userId],
    );
    return row.ll;
  }

  // ---- JWT helpers --------------------------------------------------------
  const tokenExpiringIn = (seconds: number, extra: Record<string, unknown> = {}) =>
    jwt.sign({ sub: 1, exp: Math.floor(Date.now() / 1000) + seconds, ...extra });

  const blacklistKey = (token: string) =>
    `auth:blacklist:${crypto.createHash('sha256').update(token).digest('hex')}`;

  // ---- setup --------------------------------------------------------------
  beforeAll(async () => {
    [pgContainer, redisContainer] = await Promise.all([
      new GenericContainer('postgres:16-alpine')
        .withEnvironment({ POSTGRES_USER: 'test', POSTGRES_PASSWORD: 'test', POSTGRES_DB: 'test' })
        .withExposedPorts(5432)
        .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/, 2))
        .start(),
      new GenericContainer('redis:7-alpine').withExposedPorts(6379).start(),
    ]);

    dataSource = new DataSource({
      type: 'postgres',
      host: pgContainer.getHost(),
      port: pgContainer.getMappedPort(5432),
      username: 'test',
      password: 'test',
      database: 'test',
      entities: [TestRole, TestUser],
      synchronize: false,
    });
    await dataSource.initialize();
    await dataSource.query(`
      CREATE TABLE test_roles (
        id   SERIAL PRIMARY KEY,
        slug TEXT NOT NULL
      );
      CREATE TABLE test_users (
        id          SERIAL PRIMARY KEY,
        username    TEXT NOT NULL UNIQUE,
        password    TEXT NOT NULL,
        role_id     INT REFERENCES test_roles(id),
        unique_hash TEXT,
        created_at  TIMESTAMP NOT NULL DEFAULT now(),
        last_login  TIMESTAMP,
        cc_number   TEXT
      );
    `);

    redis = new Redis({
      host: redisContainer.getHost(),
      port: redisContainer.getMappedPort(6379),
    });

    // fake identity provider: POST returns the context id, GET returns the attributes
    authServer = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        recorded.push({
          method: req.method ?? '',
          url: req.url ?? '',
          body: raw ? JSON.parse(raw) : undefined,
        });
        res.setHeader('Content-Type', 'application/json');
        if (req.method === 'POST') {
          res.end(JSON.stringify({ authenticationContextId: providerContextId }));
        } else {
          res.end(JSON.stringify(providerAttributes));
        }
      });
    });
    await new Promise<void>((resolve) => authServer.listen(0, '127.0.0.1', resolve));

    userRepo = dataSource.getRepository(TestUser);
    // Same secret the application uses, so tokens built here are valid for verifyJWT
    jwt = new JwtService({ secret: jwtConstants.secret });
    service = new AuthService(
      userRepo as any,
      redis,
      jwt,
      configService as any,
      fga as any,
      logger as any,
    );
  }, 180000);

  afterAll(async () => {
    await new Promise<void>((resolve) => authServer?.close(() => resolve()));
    if (redis) await redis.quit();
    if (dataSource?.isInitialized) await dataSource.destroy();
    await Promise.all([pgContainer?.stop(), redisContainer?.stop()]);
  });

  beforeEach(async () => {
    await redis.flushall();
    await dataSource.query('TRUNCATE test_users, test_roles RESTART IDENTITY CASCADE');

    jest.clearAllMocks();
    for (const k of Object.keys(config)) delete config[k];
    config.AUTH_SERVER = `http://127.0.0.1:${(authServer.address() as AddressInfo).port}`;
    fga.getAuthorizationLevel.mockResolvedValue('LEVEL_DEFAULT');

    recorded = [];
    providerAttributes = [];
    providerContextId = 'ctx-123';
  });

  // =========================================================================
  describe('signToken / verifyJWT / generateAuthToken', () => {
    const payload: JWTTokenPayload = { sub: 7, username: 'alice', role: 'admin', hash: 'h-1' };

    it('signToken produces an HS256 JWT carrying the payload', () => {
      const token = service.signToken(payload);

      const decoded = jwt.decode(token, { complete: true }) as any;
      expect(decoded.header.alg).toBe('HS256');
      expect(decoded.payload).toMatchObject(payload);
    });

    it('verifyJWT returns the payload of a token it signed', () => {
      expect(service.verifyJWT(service.signToken(payload))).toMatchObject(payload);
    });

    it('verifyJWT rejects a tampered token', () => {
      const token = service.signToken(payload);
      const [header, originalPayload, signature] = token.split('.');
      const forgedPayload = Buffer.from(JSON.stringify({ ...payload, role: 'root' })).toString(
        'base64url',
      );
      const forged = `${header}.${forgedPayload}.${signature}`;

      expect(forgedPayload).not.toBe(originalPayload);
      expect(() => service.verifyJWT(forged)).toThrow();
    });

    it('verifyJWT rejects a token signed with another secret', () => {
      const foreign = new JwtService({ secret: 'someone-elses-secret' }).sign(payload);

      expect(() => service.verifyJWT(foreign)).toThrow();
    });

    it('verifyJWT rejects an expired token', () => {
      const expired = jwt.sign({ ...payload, exp: Math.floor(Date.now() / 1000) - 60 });

      expect(() => service.verifyJWT(expired)).toThrow(/expired/i);
    });

    it('generateAuthToken builds the token from the user (sub, username, role slug, hash)', () => {
      const user = {
        id: 3,
        username: 'bob',
        uniqueHash: 'h-bob',
        role: { slug: 'monitor' },
      } as any;

      const decoded = service.verifyJWT(service.generateAuthToken(user));

      expect(decoded).toMatchObject({ sub: 3, username: 'bob', role: 'monitor', hash: 'h-bob' });
    });

    it('never puts a password in a token', () => {
      const user = {
        id: 3,
        username: 'bob',
        password: 'hashed:secret',
        uniqueHash: 'h',
        role: { slug: 'monitor' },
      } as any;

      const decoded = service.verifyJWT(service.generateAuthToken(user));

      expect(decoded).not.toHaveProperty('password');
    });
  });

  // =========================================================================
  describe('verifyUserCredentials', () => {
    it('returns the user with their role when username and password are correct', async () => {
      const roleId = await insertRole('admin');
      const id = await insertUser({ username: 'alice', password: 'pw', roleId });

      const user = await service.verifyUserCredentials('alice', 'pw');

      expect(user).toMatchObject({
        id,
        username: 'alice',
        uniqueHash: 'hash-alice',
        role: { id: roleId, slug: 'admin' },
      });
    });

    it('never returns the password, createdAt or lastLogin', async () => {
      const roleId = await insertRole('admin');
      await insertUser({ username: 'alice', password: 'pw', roleId });

      const user = await service.verifyUserCredentials('alice', 'pw');

      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('createdAt');
      expect(user).not.toHaveProperty('lastLogin');
    });

    it('returns null for a wrong password', async () => {
      const roleId = await insertRole('admin');
      await insertUser({ username: 'alice', password: 'pw', roleId });

      expect(await service.verifyUserCredentials('alice', 'wrong')).toBeNull();
    });

    it('returns null for an unknown username', async () => {
      expect(await service.verifyUserCredentials('ghost', 'pw')).toBeNull();
    });

    it("does not authenticate a user with another user's password", async () => {
      const roleId = await insertRole('admin');
      await insertUser({ username: 'alice', password: 'alice-pw', roleId });
      await insertUser({ username: 'bob', password: 'bob-pw', roleId });

      expect(await service.verifyUserCredentials('alice', 'bob-pw')).toBeNull();
      expect(await service.verifyUserCredentials('bob', 'bob-pw')).not.toBeNull();
    });
  });

  // =========================================================================
  describe('loginLocal', () => {
    it('returns id, a valid token, the environment and the authorization level', async () => {
      const roleId = await insertRole('admin');
      const id = await insertUser({ username: 'alice', password: 'pw', roleId });
      config.AMS_ENV = 'PROD';
      fga.getAuthorizationLevel.mockResolvedValue('LEVEL_ADMIN');

      const res = await service.loginLocal('alice', 'pw');

      expect(res).toMatchObject({ id, amsEnv: 'PROD', authorizationLevel: 'LEVEL_ADMIN' });
      expect(service.verifyJWT(res!.token)).toMatchObject({
        sub: id,
        username: 'alice',
        role: 'admin',
        hash: 'hash-alice',
      });
    });

    it("asks the authorization service about this user's id and role slug", async () => {
      const roleId = await insertRole('monitor');
      const id = await insertUser({ username: 'mona', password: 'pw', roleId });

      await service.loginLocal('mona', 'pw');

      expect(fga.getAuthorizationLevel).toHaveBeenCalledWith(id, 'monitor');
    });

    it("defaults the environment to 'DEV' when AMS_ENV is not configured", async () => {
      const roleId = await insertRole('admin');
      await insertUser({ username: 'alice', password: 'pw', roleId });

      const res = await service.loginLocal('alice', 'pw');

      expect(res!.amsEnv).toBe('DEV');
    });

    it('the issued token passes verifyUserPayload', async () => {
      const roleId = await insertRole('admin');
      await insertUser({ username: 'alice', password: 'pw', roleId });

      const res = await service.loginLocal('alice', 'pw');

      expect(await service.verifyUserPayload(service.verifyJWT(res!.token))).toBe(true);
    });

    it('throws UnauthorizedException for a wrong password, without issuing a token', async () => {
      const roleId = await insertRole('admin');
      await insertUser({ username: 'alice', password: 'pw', roleId });

      await expect(service.loginLocal('alice', 'wrong')).rejects.toThrow(UnauthorizedException);
      expect(fga.getAuthorizationLevel).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException for an unknown user', async () => {
      await expect(service.loginLocal('ghost', 'pw')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the user has no role', async () => {
      await insertUser({ username: 'norole', password: 'pw', roleId: null });

      await expect(service.loginLocal('norole', 'pw')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the user has no uniqueHash', async () => {
      const roleId = await insertRole('admin');
      await insertUser({ username: 'nohash', password: 'pw', roleId, uniqueHash: null });

      await expect(service.loginLocal('nohash', 'pw')).rejects.toThrow(UnauthorizedException);
    });
  });

  // =========================================================================
  describe('verifyUserPayload', () => {
    it('is true when the user exists and the hash matches', async () => {
      const id = await insertUser({ username: 'alice', uniqueHash: 'h-1' });

      expect(
        await service.verifyUserPayload({ sub: id, username: 'alice', role: 'x', hash: 'h-1' }),
      ).toBe(true);
    });

    it('is false when the hash no longer matches (e.g. credentials were rotated)', async () => {
      const id = await insertUser({ username: 'alice', uniqueHash: 'h-new' });

      expect(
        await service.verifyUserPayload({ sub: id, username: 'alice', role: 'x', hash: 'h-old' }),
      ).toBe(false);
    });

    it('is false when the user does not exist anymore', async () => {
      expect(
        await service.verifyUserPayload({ sub: 9999, username: 'ghost', role: 'x', hash: 'h' }),
      ).toBe(false);
    });

    it("is false when the token carries another user's hash", async () => {
      const a = await insertUser({ username: 'alice', uniqueHash: 'h-alice' });
      await insertUser({ username: 'bob', uniqueHash: 'h-bob' });

      expect(
        await service.verifyUserPayload({ sub: a, username: 'alice', role: 'x', hash: 'h-bob' }),
      ).toBe(false);
    });
  });

  // =========================================================================
  describe('updateUserLastLogin', () => {
    it('stores the current time (UTC, "YYYY-MM-DD HH:mm:ss") as the last login', async () => {
      const id = await insertUser({ username: 'alice' });
      expect(await lastLoginOf(id)).toBeNull();

      const before = Date.now();
      await service.updateUserLastLogin(id);
      const after = Date.now();

      const stored = await lastLoginOf(id);
      expect(stored).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      const storedMs = Date.parse(`${stored!.replace(' ', 'T')}Z`);
      expect(storedMs).toBeGreaterThanOrEqual(before - 1000); // second precision
      expect(storedMs).toBeLessThanOrEqual(after);
    });

    it('only touches the given user', async () => {
      const a = await insertUser({ username: 'alice' });
      const b = await insertUser({ username: 'bob' });

      await service.updateUserLastLogin(a);

      expect(await lastLoginOf(a)).not.toBeNull();
      expect(await lastLoginOf(b)).toBeNull();
    });

    it('throws InternalServerErrorException when the user does not exist', async () => {
      await expect(service.updateUserLastLogin(9999)).rejects.toThrow(InternalServerErrorException);
      await expect(service.updateUserLastLogin(9999)).rejects.toThrow(
        'Failed to update last login for user 9999',
      );
    });
  });

  // =========================================================================
  describe('logout / isTokenBlackListed', () => {
    it('a token is not blacklisted until it is logged out', async () => {
      const token = tokenExpiringIn(300);

      expect(await service.isTokenBlackListed(token)).toBe(false);
    });

    it('blacklists the token after logout', async () => {
      const token = tokenExpiringIn(300);

      await service.logout(token);

      expect(await service.isTokenBlackListed(token)).toBe(true);
    });

    it('only blacklists the token that logged out, not other tokens', async () => {
      const mine = tokenExpiringIn(300, { sub: 1 });
      const other = tokenExpiringIn(300, { sub: 2 });

      await service.logout(mine);

      expect(await service.isTokenBlackListed(other)).toBe(false);
    });

    it('keeps the entry only for as long as the token would still be valid', async () => {
      const token = tokenExpiringIn(120);

      await service.logout(token);

      const ttl = await redis.ttl(blacklistKey(token));
      expect(ttl).toBeGreaterThan(110);
      expect(ttl).toBeLessThanOrEqual(120);
    });

    it('stores a hash of the token, never the raw token', async () => {
      const token = tokenExpiringIn(300);

      await service.logout(token);

      const keys = await redis.keys('*');
      expect(keys).toEqual([blacklistKey(token)]);
      expect(keys.join('')).not.toContain(token);
    });

    it('is idempotent: logging out twice keeps it blacklisted and does not extend the entry', async () => {
      const token = tokenExpiringIn(120);

      await service.logout(token);
      const ttlFirst = await redis.ttl(blacklistKey(token));
      await service.logout(token);
      const ttlSecond = await redis.ttl(blacklistKey(token));

      expect(await service.isTokenBlackListed(token)).toBe(true);
      expect(ttlSecond).toBeGreaterThan(0);
      expect(ttlSecond).toBeLessThanOrEqual(ttlFirst);
    });

    it('does not store anything for a token that has already expired', async () => {
      const expired = tokenExpiringIn(-60);

      await service.logout(expired);

      expect(await redis.dbsize()).toBe(0);
    });

    it('a blacklisted token disappears from Redis once it expires', async () => {
      const token = tokenExpiringIn(2);

      await service.logout(token);
      expect(await service.isTokenBlackListed(token)).toBe(true);

      await new Promise((r) => setTimeout(r, 3200));

      expect(await service.isTokenBlackListed(token)).toBe(false);
    }, 10000);

    // A token without "exp" never expires by itself, so logging it out must still revoke it.
    it('revokes a token that has no expiry claim', async () => {
      const token = jwt.sign({ sub: 1 });

      await service.logout(token);

      expect(await service.isTokenBlackListed(token)).toBe(true);
    });
  });

  // =========================================================================
  describe('getAtributes', () => {
    it('asks the provider for the NIC and full name, then fetches them with the returned context id', async () => {
      providerContextId = 'ctx-42';
      providerAttributes = [];

      await service.getAtributes('tok-1');

      const [post, get] = recorded;
      expect(post.method).toBe('POST');
      expect(post.url).toBe('/oauthresourceserver/api/AttributeManager');
      expect(post.body.token).toBe('tok-1');
      expect(post.body.atributesName).toEqual(expect.arrayContaining([ATTR_NIC, ATTR_NAME]));

      expect(get.method).toBe('GET');
      const url = new URL(get.url, 'http://x');
      expect(url.pathname).toBe('/oauthresourceserver/api/AttributeManager');
      expect(url.searchParams.get('token')).toBe('tok-1');
      expect(url.searchParams.get('authenticationContextId')).toBe('ctx-42');
    });

    it('maps the provider attributes to { cc, name }', async () => {
      providerAttributes = [
        { name: CC_ATTR, value: '12345678' },
        { name: NAME_ATTR, value: 'Maria Silva' },
      ];

      const attrs = await service.getAtributes('tok');

      expect(attrs).toEqual({ cc: '12345678', name: 'Maria Silva' });
    });

    it('ignores attributes it does not know', async () => {
      providerAttributes = [
        { name: CC_ATTR, value: '12345678' },
        { name: NAME_ATTR, value: 'Maria Silva' },
        { name: 'http://interop.gov.pt/MDC/Cidadao/SomethingElse', value: 'x' },
      ];

      const attrs = await service.getAtributes('tok');

      expect(attrs).toEqual({ cc: '12345678', name: 'Maria Silva' });
    });

    it('returns no cc when the provider did not send one', async () => {
      providerAttributes = [{ name: NAME_ATTR, value: 'Maria Silva' }];

      const attrs = await service.getAtributes('tok');

      expect(attrs.cc).toBeFalsy();
    });

    it('delivers a token containing reserved URL characters intact', async () => {
      const token = 'a+b/c=d&e=f#g';

      await service.getAtributes(token);

      const get = recorded.find((r) => r.method === 'GET')!;
      expect(new URL(get.url, 'http://x').searchParams.get('token')).toBe(token);
    });
  });

  // =========================================================================
  describe('verifyLoginUser', () => {
    it('returns the user that owns the cc number and records their login', async () => {
      const roleId = await insertRole('monitor');
      const id = await insertUser({ username: 'maria', roleId, ccNumber: '12345678' });
      providerAttributes = [{ name: CC_ATTR, value: '12345678' }];

      const user = await service.verifyLoginUser('tok');

      expect(user).toMatchObject({ id, username: 'maria', ccNumber: '12345678' });
      expect(await lastLoginOf(id)).not.toBeNull();
    });

    it('only records the login for the user that matched', async () => {
      await insertUser({ username: 'maria', ccNumber: '12345678' });
      const otherId = await insertUser({ username: 'joao', ccNumber: '87654321' });
      providerAttributes = [{ name: CC_ATTR, value: '12345678' }];

      await service.verifyLoginUser('tok');

      expect(await lastLoginOf(otherId)).toBeNull();
    });

    it('returns null when the provider did not return a cc number, and changes nothing', async () => {
      const id = await insertUser({ username: 'maria', ccNumber: '12345678' });
      providerAttributes = [{ name: NAME_ATTR, value: 'Maria Silva' }];

      expect(await service.verifyLoginUser('tok')).toBeNull();
      expect(await lastLoginOf(id)).toBeNull();
    });

    it('returns null when no user has that cc number', async () => {
      await insertUser({ username: 'maria', ccNumber: '12345678' });
      providerAttributes = [{ name: CC_ATTR, value: '00000000' }];

      expect(await service.verifyLoginUser('tok')).toBeNull();
    });
  });
});
