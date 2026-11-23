import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FgaService } from '../fga.service';
import { FgaObjectIdentifier, FgaUserIdentifier, ResourceType } from '../types/fga.types';
import { FGA_DECORATOR_KEY, AnyFgaTupleCheck } from '../decorators/fga-authorization.decorator';

@Injectable()
export class FgaGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private fgaService: FgaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<
      AnyFgaTupleCheck | AnyFgaTupleCheck[] | undefined
    >(FGA_DECORATOR_KEY, [context.getHandler(), context.getClass()]);

    if (!metadata) return true;

    const tuples = Array.isArray(metadata) ? metadata : [metadata];
    // Empty tuple lists deny access.
    if (tuples.length === 0) throw new ForbiddenException('Access denied by authorization policy');

    const request = context.switchToHttp().getRequest();

    const userId = request.user?.id;
    if (!userId) throw new ForbiddenException('User not authenticated');

    const subject = `user:${userId}` as FgaUserIdentifier<ResourceType>;

    let resolvedAny = false;
    // (OR) semantics: the first tuple that passes grants access.
    for (const tuple of tuples) {
      const objectId = tuple.resourceIdResolver?.(context);
      // An unresolvable tuple can't grant access (fail-closed), but others may still apply.
      if (!objectId) continue;
      resolvedAny = true;

      const object: FgaObjectIdentifier<ResourceType> = `${tuple.objectType}:${objectId}`;
      if (await this.fgaService.check(subject, tuple.action, object)) return true;
    }

    if (!resolvedAny) throw new ForbiddenException('Unable to resolve resource ID');
    throw new ForbiddenException('Access denied by authorization policy');
  }
}
