import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLIC_ROUTE_KEY } from '../decorators/public.decorator';
import { PROTECTED_ROUTE_KEY } from '../decorators/protected.decorator';

/**
 * Fail-closed HTTP guard: every route must use @Protected() or @Public(), but not both.
 * Authentication and authorization are handled by the protected-route guards.
 */
@Injectable()
export class AccessPolicyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;

    const targets = [context.getHandler(), context.getClass()];
    const isPublic = !!this.reflector.getAllAndOverride(PUBLIC_ROUTE_KEY, targets);
    const isProtected = !!this.reflector.getAllAndOverride(PROTECTED_ROUTE_KEY, targets);

    if (isPublic === isProtected) {
      // neither declared (fail-closed) or both declared (ambiguous)
      throw new ForbiddenException('Route has no valid access policy');
    }
    return true;
  }
}
