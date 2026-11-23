import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessPolicyGuard } from './access-policy.guard';
import { PUBLIC_ROUTE_KEY } from '../decorators/public.decorator';
import { PROTECTED_ROUTE_KEY } from '../decorators/protected.decorator';

describe('AccessPolicyGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new AccessPolicyGuard(reflector as unknown as Reflector);

  const ctx = (type = 'http') =>
    ({
      getType: () => type,
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  const policy = (isPublic: boolean, isProtected: boolean) =>
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === PUBLIC_ROUTE_KEY ? isPublic : key === PROTECTED_ROUTE_KEY ? isProtected : undefined,
    );

  afterEach(() => jest.clearAllMocks());

  it('allows @Public routes', () => {
    policy(true, false);
    expect(guard.canActivate(ctx())).toBe(true);
  });

  it('allows @Protected routes', () => {
    policy(false, true);
    expect(guard.canActivate(ctx())).toBe(true);
  });

  it('denies routes without any policy (fail-closed)', () => {
    policy(false, false);
    expect(() => guard.canActivate(ctx())).toThrow(ForbiddenException);
  });

  it('denies routes declaring both policies', () => {
    policy(true, true);
    expect(() => guard.canActivate(ctx())).toThrow(ForbiddenException);
  });

  it('ignores non-http contexts', () => {
    expect(guard.canActivate(ctx('rpc'))).toBe(true);
    expect(reflector.getAllAndOverride).not.toHaveBeenCalled();
  });
});
