import * as http from 'http';
import * as crypto from 'crypto';
import { AddressInfo } from 'net';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import Redis from 'ioredis';
import { DataSource, Repository } from 'typeorm';
import {
  Controller,
  Get,
  INestApplication,
  InternalServerErrorException,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthGuard, PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from 'src/core/authentication/auth.service';
import { JwtStrategy } from 'src/core/authentication/strategies/jwt.strategy';
import { jwtConstants, NAME_CONVERTER } from 'src/core/authentication/constants/constants';
import { RoleSlug, RoleSlugMap } from 'src/core/authentication/interfaces/types';
import { FgaService } from 'src/core/authorization/fga.service';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { REDIS_CLIENT } from 'src/redis/types';
import { PermissionLevel, User } from 'src/domains/identity/user/user.entity';
import { Role } from 'src/domains/identity/role/roles.entity';
import { ContextMap, ContextMapByRole } from 'src/domains/inventory/context/context.enum';

/**
 * Password hashing has its own tests; here the stored "hash" of a password is `hashed:<password>`.
 */
jest.mock('src/common/security', () => ({
  comparePasswordHash: jest.fn(async (plain: string, hash: string) => hash === `hashed:${plain}`),
}));

// ---------------------------------------------------------------------------
// Probe endpoint protected by the real JwtStrategy (HTTP side of the integration)
// ---------------------------------------------------------------------------
@Controller('probe')
class ProbeController {
  @UseGuards(AuthGuard('jwt'))
  @Get()
  me(@Req() req: any) {
    return req.user;
  }
}

const ATTR_NIC = 'http://interop.gov.pt/MDC/Cidadao/NIC';
const ATTR_NAME = 'http://interop.gov.pt/MDC/Cidadao/NomeCompleto';

describe('Auth integration: AuthService + JwtStrategy (Postgres + Redis)', () => {
  let pgContainer: StartedTestContainer;
  let redisContainer: StartedTestContainer;
  let dataSource: DataSource;
  let redis: Redis;
  let identityProvider: http.Server;

  let moduleRef: TestingModule;
  let app: INestApplication;
  let baseUrl: string;

  let authService: AuthService;
  let userRepo: Repository<User>;
  let adminRole: Role;
  let monitorRole: Role;

  // JWTs signed with the app secret but with full control over the claims
  const plainJwt = new JwtService({ secret: jwtConstants.secret });

  const config: Record<string, string | undefined> = {};
  const configService = { get: jest.fn((key: string) => config[key]) };
  const fga = { getAuthorizationLevel: jest.fn() };
  const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn(), debug: jest.fn() };

  // what the fake identity provider answers
  let providerAttributes: Array<{ name: string; value: string }> = [];
  let providerContextId = 'ctx-123';
  let recorded: Array<{ method: string; url: string; body: any }> = [];

  const attrNameFor = (field: string, fallback: string) =>
    Object.entries(NAME_CONVERTER as Record<string, string>).find(([, v]) => v === field)?.[0] ??
    fallback;
  const CC_ATTR = attrNameFor('cc', ATTR_NIC);
  const NAME_ATTR = attrNameFor('name', ATTR_NAME);

  // the role string that travels in the token for each RoleSlug
  const roleStringFor = (slug: RoleSlug) =>
    Object.entries(RoleSlugMap as Record<string, RoleSlug>).find(([, v]) => v === slug)![0];
  const ADMIN_ROLE = roleStringFor(RoleSlug.ADMIN);
  const MONITOR_ROLE = roleStringFor(RoleSlug.MONITOR);

  // ---- helpers -------------------------------------------------------------
  async function createRole(slug: string, display_name: string): Promise<Role> {
    const repo = dataSource.getRepository(Role);
    return repo.save(
      repo.create({ slug, displayName: display_name } as any) as any,
    ) as unknown as Promise<Role>;
  }

  async function createUser(opts: {
    username: string;
    password?: string;
    role?: Role;
    uniqueHash?: string;
    ccNumber?: string;
  }): Promise<User> {
    const role = opts.role ?? adminRole;
    return userRepo.save(
      userRepo.create({
        username: opts.username,
        password: `hashed:${opts.password ?? 'pw'}`,
        roleId: role.id,
        uniqueHash: opts.uniqueHash ?? `hash-${opts.username}`,
        permission: PermissionLevel.VIEWER,
        ccNumber: opts.ccNumber,
      }),
    );
  }

  async function lastLoginOf(userId: number): Promise<string | null> {
    const [row] = await dataSource.query(
      `SELECT to_char(last_login AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') AS ll
         FROM users WHERE id = $1`,
      [userId],
    );
    return row.ll;
  }

  const tokenExpiringIn = (seconds: number, extra: Record<string, unknown> = {}) =>
    plainJwt.sign({ sub: 1, exp: Math.floor(Date.now() / 1000) + seconds, ...extra });

  const blacklistKey = (token: string) =>
    `auth:blacklist:${crypto.createHash('sha256').update(token).digest('hex')}`;

  const callProbe = (token?: string) =>
    fetch(`${baseUrl}/probe`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

  // ---- setup ---------------------------------------------------------------
  beforeAll(async () => {
    // Postgres and Redis are started at the same time
    [pgContainer, redisContainer] = await Promise.all([
      new GenericContainer('postgres:16-alpine')
        .withEnvironment({ POSTGRES_USER: 'test', POSTGRES_PASSWORD: 'test', POSTGRES_DB: 'test' })
        .withExposedPorts(5432)
        .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/, 2))
        .start(),
      new GenericContainer('redis:7-alpine').withExposedPorts(6379).start(),
    ]);

    // Real entities, schema generated from them. If Role has relations to other entities,
    // add those entities to this list.
    dataSource = new DataSource({
      type: 'postgres',
      host: pgContainer.getHost(),
      port: pgContainer.getMappedPort(5432),
      username: 'test',
      password: 'test',
      database: 'test',
      entities: [User, Role],
      synchronize: true,
    });
    await dataSource.initialize();

    redis = new Redis({
      host: redisContainer.getHost(),
      port: redisContainer.getMappedPort(6379),
    });

    // fake identity provider (AUTH_SERVER)
    identityProvider = http.createServer((req, res) => {
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
        res.end(
          JSON.stringify(
            req.method === 'POST'
              ? { authenticationContextId: providerContextId }
              : providerAttributes,
          ),
        );
      });
    });
    await new Promise<void>((resolve) => identityProvider.listen(0, '127.0.0.1', resolve));

    userRepo = dataSource.getRepository(User);

    moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: jwtConstants.secret, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [ProbeController],
      providers: [
        AuthService,
        JwtStrategy,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: REDIS_CLIENT, useValue: redis },
        { provide: ConfigService, useValue: configService },
        { provide: FgaService, useValue: fga },
        { provide: AppLoggerService, useValue: logger },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();

    authService = moduleRef.get(AuthService);

    adminRole = await createRole(ADMIN_ROLE, 'Admin role');
    monitorRole = await createRole(MONITOR_ROLE, 'Monitor role');
  }, 180000);

  afterAll(async () => {
    await app?.close();
    await new Promise<void>((resolve) => identityProvider?.close(() => resolve()));
    if (redis) await redis.quit();
    if (dataSource?.isInitialized) await dataSource.destroy();
    await Promise.all([pgContainer?.stop(), redisContainer?.stop()]);
  });

  beforeEach(async () => {
    await redis.flushall();
    await dataSource.query('TRUNCATE users RESTART IDENTITY CASCADE');

    jest.clearAllMocks();
    for (const k of Object.keys(config)) delete config[k];
    config.AUTH_SERVER = `http://127.0.0.1:${(identityProvider.address() as AddressInfo).port}`;
    fga.getAuthorizationLevel.mockResolvedValue('LEVEL_DEFAULT');

    recorded = [];
    providerAttributes = [];
    providerContextId = 'ctx-123';
  });

  // =========================================================================
  describe('AuthService: tokens', () => {
    const payload = { sub: 7, username: 'alice', role: 'admin', hash: 'h-1' };

    it('signToken issues an HS256 JWT carrying the payload', () => {
      const decoded = plainJwt.decode(authService.signToken(payload), { complete: true }) as any;

      expect(decoded.header.alg).toBe('HS256');
      expect(decoded.payload).toMatchObject(payload);
    });

    it('verifyJWT accepts its own tokens and rejects tampered, foreign and expired ones', () => {
      const token = authService.signToken(payload);
      expect(authService.verifyJWT(token)).toMatchObject(payload);

      const [h, , s] = token.split('.');
      const forged = `${h}.${Buffer.from(JSON.stringify({ ...payload, role: 'root' })).toString('base64url')}.${s}`;
      expect(() => authService.verifyJWT(forged)).toThrow();

      expect(() =>
        authService.verifyJWT(new JwtService({ secret: 'someone-else' }).sign(payload)),
      ).toThrow();

      expect(() =>
        authService.verifyJWT(
          plainJwt.sign({ ...payload, exp: Math.floor(Date.now() / 1000) - 60 }),
        ),
      ).toThrow(/expired/i);
    });

    it('generateAuthToken builds the token from a persisted user', async () => {
      const user = await createUser({ username: 'bob', role: monitorRole });
      const full = await userRepo.findOneOrFail({ where: { id: user.id } });

      const decoded = authService.verifyJWT(authService.generateAuthToken(full));

      expect(decoded).toMatchObject({
        sub: user.id,
        username: 'bob',
        role: monitorRole.slug,
        hash: 'hash-bob',
      });
      expect(decoded).not.toHaveProperty('password');
    });
  });

  // =========================================================================
  describe('AuthService: credentials and login', () => {
    it('verifyUserCredentials returns the user with role, without private fields', async () => {
      const u = await createUser({ username: 'alice', password: 'pw' });

      const found = await authService.verifyUserCredentials('alice', 'pw');

      expect(found).toMatchObject({
        id: u.id,
        username: 'alice',
        uniqueHash: 'hash-alice',
        role: { id: adminRole.id, slug: adminRole.slug },
      });
      expect(found).not.toHaveProperty('password');
      expect(found).not.toHaveProperty('createdAt');
      expect(found).not.toHaveProperty('lastLogin');
    });

    it("verifyUserCredentials returns null for a wrong password, an unknown user or another user's password", async () => {
      await createUser({ username: 'alice', password: 'alice-pw' });
      await createUser({ username: 'bob', password: 'bob-pw' });

      expect(await authService.verifyUserCredentials('alice', 'wrong')).toBeNull();
      expect(await authService.verifyUserCredentials('ghost', 'x')).toBeNull();
      expect(await authService.verifyUserCredentials('alice', 'bob-pw')).toBeNull();
    });

    it('does not authenticate a soft-deleted user', async () => {
      const u = await createUser({ username: 'gone', password: 'pw' });
      await userRepo.softDelete(u.id);

      expect(await authService.verifyUserCredentials('gone', 'pw')).toBeNull();
      await expect(authService.loginLocal('gone', 'pw')).rejects.toThrow(UnauthorizedException);
    });

    it('loginLocal returns id, a verifiable token, environment and authorization level', async () => {
      const u = await createUser({ username: 'alice', password: 'pw' });
      config.AMS_ENV = 'PROD';
      fga.getAuthorizationLevel.mockResolvedValue('LEVEL_ADMIN');

      const res = await authService.loginLocal('alice', 'pw');

      expect(res).toMatchObject({ id: u.id, amsEnv: 'PROD', authorizationLevel: 'LEVEL_ADMIN' });
      expect(authService.verifyJWT(res!.token)).toMatchObject({
        sub: u.id,
        username: 'alice',
        role: adminRole.slug,
        hash: 'hash-alice',
      });
      expect(fga.getAuthorizationLevel).toHaveBeenCalledWith(u.id, adminRole.slug);
    });

    it("defaults the environment to 'DEV'", async () => {
      await createUser({ username: 'alice', password: 'pw' });

      expect((await authService.loginLocal('alice', 'pw'))!.amsEnv).toBe('DEV');
    });

    it('loginLocal throws UnauthorizedException for bad credentials without asking for authorization', async () => {
      await createUser({ username: 'alice', password: 'pw' });

      await expect(authService.loginLocal('alice', 'wrong')).rejects.toThrow(UnauthorizedException);
      await expect(authService.loginLocal('ghost', 'pw')).rejects.toThrow(UnauthorizedException);
      expect(fga.getAuthorizationLevel).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  describe('AuthService: verifyUserPayload / updateUserLastLogin', () => {
    it('verifyUserPayload is true only for an existing user with a matching hash', async () => {
      const u = await createUser({ username: 'alice', uniqueHash: 'h-1' });
      const other = await createUser({ username: 'bob', uniqueHash: 'h-bob' });
      const p = { sub: u.id, username: 'alice', role: 'x', hash: 'h-1' };

      expect(await authService.verifyUserPayload(p)).toBe(true);
      expect(await authService.verifyUserPayload({ ...p, hash: 'h-old' })).toBe(false);
      expect(await authService.verifyUserPayload({ ...p, hash: 'h-bob' })).toBe(false);
      expect(await authService.verifyUserPayload({ ...p, sub: 99999 })).toBe(false);
      expect(other.id).not.toBe(u.id);
    });

    it('verifyUserPayload is false for a soft-deleted user', async () => {
      const u = await createUser({ username: 'alice', uniqueHash: 'h-1' });
      await userRepo.softDelete(u.id);

      expect(
        await authService.verifyUserPayload({
          sub: u.id,
          username: 'alice',
          role: 'x',
          hash: 'h-1',
        }),
      ).toBe(false);
    });

    it('updateUserLastLogin stores the current time for that user only', async () => {
      const a = await createUser({ username: 'alice' });
      const b = await createUser({ username: 'bob' });

      const before = Date.now();
      await authService.updateUserLastLogin(a.id);
      const after = Date.now();

      const stored = await lastLoginOf(a.id);
      const storedMs = Date.parse(`${stored!.replace(' ', 'T')}Z`);
      expect(storedMs).toBeGreaterThanOrEqual(before - 1000); // second precision
      expect(storedMs).toBeLessThanOrEqual(after);
      expect(await lastLoginOf(b.id)).toBeNull();
    });

    it('updateUserLastLogin throws InternalServerErrorException for an unknown user', async () => {
      await expect(authService.updateUserLastLogin(99999)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // =========================================================================
  describe('AuthService: logout / blacklist (real Redis)', () => {
    it('a token is only blacklisted after logout, and other tokens are unaffected', async () => {
      const mine = tokenExpiringIn(300, { sub: 1 });
      const other = tokenExpiringIn(300, { sub: 2 });
      expect(await authService.isTokenBlackListed(mine)).toBe(false);

      await authService.logout(mine);

      expect(await authService.isTokenBlackListed(mine)).toBe(true);
      expect(await authService.isTokenBlackListed(other)).toBe(false);
    });

    it('keeps the entry only while the token would still be valid and stores a hash, not the token', async () => {
      const token = tokenExpiringIn(120);

      await authService.logout(token);

      const ttl = await redis.ttl(blacklistKey(token));
      expect(ttl).toBeGreaterThan(110);
      expect(ttl).toBeLessThanOrEqual(120);
      expect((await redis.keys('*')).join('')).not.toContain(token);
    });

    it('is idempotent and does not extend the entry', async () => {
      const token = tokenExpiringIn(120);

      await authService.logout(token);
      const first = await redis.ttl(blacklistKey(token));
      await authService.logout(token);
      const second = await redis.ttl(blacklistKey(token));

      expect(await authService.isTokenBlackListed(token)).toBe(true);
      expect(second).toBeGreaterThan(0);
      expect(second).toBeLessThanOrEqual(first);
    });

    it('does not store an already expired token', async () => {
      await authService.logout(tokenExpiringIn(-60));

      expect(await redis.dbsize()).toBe(0);
    });

    it('the entry disappears from Redis when the token expires', async () => {
      const token = tokenExpiringIn(2);

      await authService.logout(token);
      expect(await authService.isTokenBlackListed(token)).toBe(true);

      await new Promise((r) => setTimeout(r, 3200));

      expect(await authService.isTokenBlackListed(token)).toBe(false);
    }, 10000);

    // A token without "exp" never expires by itself, so logging it out must still revoke it.
    it('revokes a token that has no expiry claim', async () => {
      const token = plainJwt.sign({ sub: 1 });

      await authService.logout(token);

      expect(await authService.isTokenBlackListed(token)).toBe(true);
    });
  });

  // =========================================================================
  describe('AuthService: identity provider (getAtributes / verifyLoginUser)', () => {
    it('performs the two-step exchange and maps attributes to { cc, name }', async () => {
      providerContextId = 'ctx-42';
      providerAttributes = [
        { name: CC_ATTR, value: '12345678' },
        { name: NAME_ATTR, value: 'Maria Silva' },
        { name: 'http://interop.gov.pt/MDC/Cidadao/Other', value: 'ignored' },
      ];

      const attrs = await authService.getAtributes('tok-1');

      expect(attrs).toEqual({ cc: '12345678', name: 'Maria Silva' });
      const [post, get] = recorded;
      expect(post.method).toBe('POST');
      expect(post.body.token).toBe('tok-1');
      expect(post.body.atributesName).toEqual(expect.arrayContaining([ATTR_NIC, ATTR_NAME]));
      const url = new URL(get.url, 'http://x');
      expect(url.searchParams.get('token')).toBe('tok-1');
      expect(url.searchParams.get('authenticationContextId')).toBe('ctx-42');
    });

    it('delivers a token with reserved URL characters intact', async () => {
      const token = 'a+b/c=d&e=f#g';

      await authService.getAtributes(token);

      const get = recorded.find((r) => r.method === 'GET')!;
      expect(new URL(get.url, 'http://x').searchParams.get('token')).toBe(token);
    });

    it('verifyLoginUser returns the user owning the cc number and records only their login', async () => {
      const maria = await createUser({ username: 'maria', ccNumber: '12345678' });
      const joao = await createUser({ username: 'joao', ccNumber: '87654321' });
      providerAttributes = [{ name: CC_ATTR, value: '12345678' }];

      const user = await authService.verifyLoginUser('tok');

      expect(user).toMatchObject({ id: maria.id, username: 'maria', ccNumber: '12345678' });
      expect(await lastLoginOf(maria.id)).not.toBeNull();
      expect(await lastLoginOf(joao.id)).toBeNull();
    });

    it('verifyLoginUser returns null when there is no cc, or no user with that cc', async () => {
      const maria = await createUser({ username: 'maria', ccNumber: '12345678' });

      providerAttributes = [{ name: NAME_ATTR, value: 'Maria' }];
      expect(await authService.verifyLoginUser('tok')).toBeNull();

      providerAttributes = [{ name: CC_ATTR, value: '00000000' }];
      expect(await authService.verifyLoginUser('tok')).toBeNull();

      expect(await lastLoginOf(maria.id)).toBeNull();
    });
  });

  // =========================================================================
  describe('JwtStrategy over HTTP (token issued by AuthService)', () => {
    it('accepts a token issued by loginLocal and exposes the authenticated user', async () => {
      const u = await createUser({ username: 'alice', password: 'pw' });
      const { token } = (await authService.loginLocal('alice', 'pw'))!;

      const res = await callProbe(token);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        id: u.id,
        username: 'alice',
        role_slug: RoleSlug.ADMIN,
        context: {
          id: ContextMap[ContextMapByRole[RoleSlug.ADMIN]],
          code: ContextMapByRole[RoleSlug.ADMIN],
        },
      });
    });

    it('maps a monitor to the monitor context', async () => {
      await createUser({ username: 'mona', password: 'pw', role: monitorRole });
      const { token } = (await authService.loginLocal('mona', 'pw'))!;

      const body = await (await callProbe(token)).json();

      expect(body.role_slug).toBe(RoleSlug.MONITOR);
      expect(body.context.code).toBe(ContextMapByRole[RoleSlug.MONITOR]);
    });

    it('rejects a request without a token', async () => {
      expect((await callProbe()).status).toBe(401);
    });

    it('rejects a token after logout', async () => {
      await createUser({ username: 'alice', password: 'pw' });
      const { token } = (await authService.loginLocal('alice', 'pw'))!;
      expect((await callProbe(token)).status).toBe(200);

      await authService.logout(token);

      expect((await callProbe(token)).status).toBe(401);
    });

    it('logging out one session does not log out another session of the same user', async () => {
      await createUser({ username: 'alice', password: 'pw' });
      const first = (await authService.loginLocal('alice', 'pw'))!.token;
      const second = tokenExpiringIn(300, {
        sub: (await userRepo.findOneByOrFail({ username: 'alice' })).id,
        username: 'alice',
        role: adminRole.slug,
        hash: 'hash-alice',
      });

      await authService.logout(first);

      expect((await callProbe(first)).status).toBe(401);
      expect((await callProbe(second)).status).toBe(200);
    });

    it("rejects a token once the user's uniqueHash has changed", async () => {
      const u = await createUser({ username: 'alice', password: 'pw' });
      const { token } = (await authService.loginLocal('alice', 'pw'))!;

      await userRepo.update(u.id, { uniqueHash: 'rotated' });

      expect((await callProbe(token)).status).toBe(401);
    });

    it('rejects the token of a soft-deleted user', async () => {
      const u = await createUser({ username: 'alice', password: 'pw' });
      const { token } = (await authService.loginLocal('alice', 'pw'))!;

      await userRepo.softDelete(u.id);

      expect((await callProbe(token)).status).toBe(401);
    });

    it('rejects an expired token, a token signed with another secret and a garbage token', async () => {
      const u = await createUser({ username: 'alice', password: 'pw' });
      const claims = { sub: u.id, username: 'alice', role: adminRole.slug, hash: 'hash-alice' };

      const expired = plainJwt.sign({ ...claims, exp: Math.floor(Date.now() / 1000) - 60 });
      const foreign = new JwtService({ secret: 'someone-else' }).sign(claims);

      expect((await callProbe(expired)).status).toBe(401);
      expect((await callProbe(foreign)).status).toBe(401);
      expect((await callProbe('not.a.jwt')).status).toBe(401);
    });

    it('rejects a valid token whose role is not a known role', async () => {
      const u = await createUser({ username: 'alice', password: 'pw' });
      const token = plainJwt.sign({
        sub: u.id,
        username: 'alice',
        role: 'not-a-role',
        hash: 'hash-alice',
      });

      expect((await callProbe(token)).status).toBe(401);
    });
  });
});
