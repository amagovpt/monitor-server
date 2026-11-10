import { NotFoundException, UnauthorizedException } from '@nestjs/common';

import { JwtStrategy } from 'src/core/authentication/strategies/jwt.strategy';
import { RoleSlug, RoleSlugMap } from 'src/core/authentication/interfaces/types';
import { ContextMap, ContextMapByRole } from 'src/domains/inventory/context/context.enum';

const roleStringFor = (slug: RoleSlug) =>
  Object.entries(RoleSlugMap as Record<string, RoleSlug>).find(([, v]) => v === slug)![0];

const reqWith = (authorization?: string) =>
  ({ headers: authorization ? { authorization } : {} }) as any;

const payloadFor = (slug: RoleSlug, over: Record<string, unknown> = {}) => ({
  sub: 11,
  username: 'alice',
  role: roleStringFor(slug),
  hash: 'h',
  ...over,
});

describe('JwtStrategy (unit, mocked AuthService)', () => {
  const authService = { verifyUserPayload: jest.fn(), isTokenBlackListed: jest.fn() };
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.resetAllMocks();
    authService.verifyUserPayload.mockResolvedValue(true);
    authService.isTokenBlackListed.mockResolvedValue(false);
    strategy = new JwtStrategy(authService as any);
  });

  describe('validate: success', () => {
    it('returns the authenticated user with role slug and context for an administrator', async () => {
      const payload = payloadFor(RoleSlug.ADMIN);
      const code = ContextMapByRole[RoleSlug.ADMIN];

      const user = await strategy.validate(reqWith('Bearer abc'), payload as any);

      expect(user).toEqual({
        id: 11,
        username: 'alice',
        role_slug: RoleSlug.ADMIN,
        context: { id: ContextMap[code], code },
      });
    });

    it('returns the monitor context for a monitor', async () => {
      const code = ContextMapByRole[RoleSlug.MONITOR];

      const user = await strategy.validate(
        reqWith('Bearer abc'),
        payloadFor(RoleSlug.MONITOR) as any,
      );

      expect(user.role_slug).toBe(RoleSlug.MONITOR);
      expect(user.context).toEqual({ id: ContextMap[code], code });
    });

    it('does not expose the token hash in the returned user', async () => {
      const user = await strategy.validate(
        reqWith('Bearer abc'),
        payloadFor(RoleSlug.ADMIN) as any,
      );

      expect(user).not.toHaveProperty('hash');
    });

    it('validates the payload and checks the raw token (without "Bearer ") against the blacklist', async () => {
      const payload = payloadFor(RoleSlug.ADMIN);

      await strategy.validate(reqWith('Bearer the.raw.token'), payload as any);

      expect(authService.verifyUserPayload).toHaveBeenCalledWith(payload);
      expect(authService.isTokenBlackListed).toHaveBeenCalledWith('the.raw.token');
    });
  });

  describe('validate: rejections', () => {
    it('rejects a request without an Authorization header', async () => {
      const p = strategy.validate(reqWith(), payloadFor(RoleSlug.ADMIN) as any);

      await expect(p).rejects.toThrow(UnauthorizedException);
      await expect(p).rejects.toThrow('No token provided');
    });

    it('rejects an Authorization header that has no token after the scheme', async () => {
      await expect(
        strategy.validate(reqWith('Bearer'), payloadFor(RoleSlug.ADMIN) as any),
      ).rejects.toThrow('No token provided');
    });

    it('rejects when the payload no longer matches the user', async () => {
      authService.verifyUserPayload.mockResolvedValue(false);

      await expect(
        strategy.validate(reqWith('Bearer abc'), payloadFor(RoleSlug.ADMIN) as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a blacklisted token', async () => {
      authService.isTokenBlackListed.mockResolvedValue(true);

      await expect(
        strategy.validate(reqWith('Bearer abc'), payloadFor(RoleSlug.ADMIN) as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an unknown role and names it in the message', async () => {
      const p = strategy.validate(
        reqWith('Bearer abc'),
        payloadFor(RoleSlug.ADMIN, { role: 'nope' }) as any,
      );

      await expect(p).rejects.toThrow(UnauthorizedException);
      await expect(p).rejects.toThrow('Invalid role slug: nope');
    });

    it('propagates errors from the AuthService instead of letting the user in', async () => {
      authService.verifyUserPayload.mockRejectedValue(new Error('db down'));

      await expect(
        strategy.validate(reqWith('Bearer abc'), payloadFor(RoleSlug.ADMIN) as any),
      ).rejects.toThrow('db down');
    });
  });

  // The two checks below need a role without a context / a context without an id. The enum
  // modules are replaced inside an isolated module registry to build those situations.
  describe('validate: role/context configuration problems', () => {
    function loadStrategy(contextOverrides: Record<string, unknown>): JwtStrategy {
      let Strategy: any;
      jest.isolateModules(() => {
        jest.doMock('src/domains/inventory/context/context.enum', () => ({
          ...jest.requireActual('src/domains/inventory/context/context.enum'),
          ...contextOverrides,
        }));
        jest.doMock('src/core/authentication/auth.service', () => ({ AuthService: class {} }));
        Strategy = require('src/core/authentication/strategies/jwt.strategy').JwtStrategy;
      });
      return new Strategy(authService);
    }

    afterEach(() => {
      jest.dontMock('src/domains/inventory/context/context.enum');
      jest.dontMock('src/core/authentication/auth.service');
    });

    it('rejects a role that is not associated with any context', async () => {
      const s = loadStrategy({ ContextMapByRole: {} });

      const p = s.validate(reqWith('Bearer abc'), payloadFor(RoleSlug.ADMIN) as any);

      await expect(p).rejects.toMatchObject({ status: 401 });
      await expect(p).rejects.toThrow(/not associated to Context/);
    });

    it('answers 404 when the context has no id', async () => {
      const s = loadStrategy({ ContextMap: {} });

      const p = s.validate(reqWith('Bearer abc'), payloadFor(RoleSlug.ADMIN) as any);

      await expect(p).rejects.toMatchObject({ status: 404 });
      await expect(p).rejects.toThrow(/Context Id not found/);
    });

    it('sanity: the isolated loader does not break the success path', async () => {
      const s = loadStrategy({});

      await expect(
        s.validate(reqWith('Bearer abc'), payloadFor(RoleSlug.ADMIN) as any),
      ).resolves.toMatchObject({ role_slug: RoleSlug.ADMIN });
      expect(NotFoundException).toBeDefined();
    });
  });
});
