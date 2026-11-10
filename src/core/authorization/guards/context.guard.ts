import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ContextHierarchyByRole,
  ContextEnum,
  ContextMap,
} from 'src/domains/inventory/context/context.enum';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';

/**
 * Converts a raw filter value (case-insensitive code or numeric id)
 * into a ContextEnum. Returns undefined when the value is not recognized.
 */
function normalizeContext(value: unknown): ContextEnum | undefined {
  if (typeof value === 'string') {
    const code = value.trim().toUpperCase();
    return Object.values(ContextEnum).find((c) => c === code);
  }

  if (typeof value === 'number') {
    return (Object.keys(ContextMap) as ContextEnum[]).find((key) => ContextMap[key] === value);
  }

  return undefined;
}

/**
 * Collects every raw context value sent by the client, whether it comes from
 * the top-level `contexts` (e.g. WebsiteQueryRequestDTO) or from `filters.contexts`.
 * Each source may be a single value or an array.
 */
function collectRawContexts(body: unknown): unknown[] {
  if (!body || typeof body !== 'object') {
    return [];
  }

  const { contexts, filters } = body as {
    contexts?: unknown;
    filters?: { contexts?: unknown } | null;
  };

  return [contexts, filters?.contexts].flatMap((source) => {
    if (source === undefined || source === null) {
      return [];
    }
    return Array.isArray(source) ? source : [source];
  });
}

@Injectable()
export class ContextFilterGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as Request & { user?: AuthenticatedUser }).user;

    if (!user) {
      throw new ForbiddenException('Authentication context not found.');
    }

    const userRole: RoleSlug = user.role_slug;

    const rawList: unknown[] = collectRawContexts(request.body);

    if (rawList.length === 0) {
      return true;
    }

    // Fail closed: unknown values must never bypass the permission check
    const targetContexts: ContextEnum[] = rawList.map((raw) => {
      const normalized = normalizeContext(raw);
      if (!normalized) {
        throw new BadRequestException(`Invalid context filter value: ${String(raw)}`);
      }
      return normalized;
    });

    const allowedContexts = ContextHierarchyByRole[userRole];

    if (!allowedContexts) {
      throw new ForbiddenException('Your role has no authorized contexts.');
    }

    const isAuthorized = targetContexts.every((target) => allowedContexts.includes(target));

    if (!isAuthorized) {
      throw new ForbiddenException(
        'You are not permitted to filter data by one or more of the requested contexts.',
      );
    }

    return true;
  }
}
