import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { RoleSlug } from 'src/core/authentication/interfaces/types';
import { JwtAuthGuard } from 'src/core/authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { FgaGuard } from '../guards/fga.guard';
import { DestructionChallengeGuard } from '../guards/destruction-challenge.guard';
import { Roles } from './roles.decorator';
import { FgaAuthorized, FgaTupleChecks } from './fga-authorization.decorator';
import { RequireDestructionChallenge } from './destruction-challenge.decorator';
import { EnquireRelationType, ResourceType } from '../types/fga.types';

export const PROTECTED_ROUTE_KEY = 'access_policy:protected';

export type ProtectedRoles = [RoleSlug, ...RoleSlug[]] | 'authenticated';

export interface ProtectedOptions<T extends ResourceType, E extends keyof EnquireRelationType> {
  /** Allowed roles, or 'authenticated' for JWT-only access. */
  roles: ProtectedRoles;
  /** Optional OpenFGA tuple check. */
  fga?: FgaTupleChecks<T, E>;
  /** Require the two-step destruction challenge (X-Confirmation-Code). */
  destructive?: boolean;
}

/** Combines JWT, RBAC, optional OpenFGA, and destruction challenge guards. */
export function Protected<T extends ResourceType, E extends keyof EnquireRelationType>(
  options: ProtectedOptions<T, E>,
): MethodDecorator & ClassDecorator {
  const { roles } = options ?? ({} as ProtectedOptions<T, E>);
  const docs = [
    SetMetadata(PROTECTED_ROUTE_KEY, true),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Missing or invalid token' }),
  ];

  if (roles === 'authenticated') {
    if (options.fga || options.destructive) {
      throw new Error(
        "@Protected({ roles: 'authenticated' }) cannot be combined with fga/destructive.",
      );
    }
    return applyDecorators(UseGuards(JwtAuthGuard), ...docs);
  }

  if (!Array.isArray(roles) || roles.length === 0) {
    throw new Error("@Protected() requires at least one role or roles: 'authenticated'.");
  }

  const guards = [
    JwtAuthGuard,
    RolesGuard,
    FgaGuard,
    ...(options.destructive ? [DestructionChallengeGuard] : []),
  ];

  return applyDecorators(
    UseGuards(...guards),
    Roles(...roles),
    ...(options.fga ? [FgaAuthorized(options.fga)] : []),
    ...(options.destructive ? [RequireDestructionChallenge()] : []),
    ...docs,
    ApiForbiddenResponse({ description: 'Insufficient role or FGA policy denied' }),
  );
}
