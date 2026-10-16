import { Injectable } from '@nestjs/common';
import { FgaService } from '../fga.service';
import { AssignationRelationType, FgaTupleAssign, FgaTupleEnquire } from '../types/fga.types';
import {
  MapPermissionsRoles,
  PermissionKey,
  RegistryHandlers,
  TeamsPayload,
  UserPayload,
  WebsiteCreatePayload,
  WebsitePayload,
  WebsiteUserPayload,
} from '../queue/payload.types';
import { AUTHORIZATION_ACTION } from './registry.keys';
import { RoleSlug } from 'src/core/authentication/interfaces/types';

@Injectable()
export class AuthorizationRegistry {
  constructor(private readonly fgaService: FgaService) {}

  private readonly registry: {
    [K in keyof RegistryHandlers]: (payload: RegistryHandlers[K]) => Promise<void>;
  } = {
    [AUTHORIZATION_ACTION.USER_CREATE]: async (payload: UserPayload) => {
      const permission = MapPermissionsRoles[payload.permission];
      const role = payload.role === RoleSlug.MONITOR ? RoleSlug.MONITOR : 'ams';

      if (!permission) throw new Error(`Invalid permission: ${payload.permission}`);
      await this.fgaService.createRelationship(
        this.fgaService.makeFgaTuple('role', role, permission, `user:${payload.userId}`),
      );
    },
    [AUTHORIZATION_ACTION.USER_DELETE]: async (payload: UserPayload) => {
      await this.fgaService.purgeAllTuplesForUser(payload.userId);
    },
    [AUTHORIZATION_ACTION.USER_UPDATE]: async (payload: UserPayload) => {
      // Determina o papel antigo e o novo papel (fallback para o atual se newRole não vier preenchido)
      const currentRoleKey = payload.role === RoleSlug.MONITOR ? RoleSlug.MONITOR : 'ams';
      const targetRoleKey = payload.newRole
        ? payload.newRole === RoleSlug.MONITOR
          ? RoleSlug.MONITOR
          : 'ams'
        : currentRoleKey;

      // 1. Remove as relações antigas estritamente do papel/role anterior
      await this.fgaService.removeUserRelations('role', payload.userId.toString(), currentRoleKey, [
        'manager',
        'editor',
        'viewer',
      ]);

      if (currentRoleKey !== targetRoleKey) {
        await this.fgaService.removeUserRelations(
          'role',
          payload.userId.toString(),
          targetRoleKey,
          ['manager', 'editor', 'viewer'],
        );
      }

      const permissionToUse = payload.newPermission ?? payload.permission;
      const permission = MapPermissionsRoles[permissionToUse];

      if (!permission) throw new Error(`Invalid permission: ${permissionToUse}`);

      await this.fgaService.createRelationship(
        this.fgaService.makeFgaTuple('role', targetRoleKey, permission, `user:${payload.userId}`),
      );
    },
    [AUTHORIZATION_ACTION.TEAM_CREATE]: async (payload: TeamsPayload) => {
      await this.fgaService.createRelationship(
        this.fgaService.makeFgaTuple(
          'team',
          payload.teamId.toString(),
          'team_role',
          `role:monitor`,
        ),
      );
      await this.fgaService.createRelationship(
        this.fgaService.makeFgaTuple('team', payload.teamId.toString(), 'admin_role', `role:ams`),
      );
    },
    [AUTHORIZATION_ACTION.TEAM_DELETE]: async (payload: TeamsPayload) => {
      const tuples: FgaTupleEnquire<any>[] = [
        this.fgaService.makeFgaTuple(
          'team',
          payload.teamId.toString(),
          'team_role',
          `role:monitor`,
        ),
      ];
      await this.fgaService.deleteBatchesRelationships(tuples);
      await this.fgaService.createRelationship(
        this.fgaService.makeFgaTuple('team', payload.teamId.toString(), 'admin_role', `role:ams`),
      );
    },
    [AUTHORIZATION_ACTION.TEAM_ADD_MEMBER]: async (payload: TeamsPayload) => {
      const tuples: FgaTupleEnquire<any>[] =
        payload.userIds?.map((userId) =>
          this.fgaService.makeFgaTuple(
            'team',
            payload.teamId.toString(),
            'member',
            `user:${userId}`,
          ),
        ) || [];
      await this.fgaService.createBatchesRelationships(tuples);
    },
    [AUTHORIZATION_ACTION.TEAM_REMOVE_MEMBER]: async (payload: TeamsPayload) => {
      const tuples: FgaTupleEnquire<any>[] =
        payload.userIds?.map((userId) =>
          this.fgaService.makeFgaTuple(
            'team',
            payload.teamId.toString(),
            'member',
            `user:${userId}`,
          ),
        ) || [];
      await this.fgaService.deleteBatchesRelationships(tuples);
    },
    [AUTHORIZATION_ACTION.TEAM_ADD_WEBSITE]: async (payload: TeamsPayload) => {
      const tuples: FgaTupleEnquire<any>[] =
        payload.websiteIds?.map((websiteId) =>
          this.fgaService.makeFgaTuple(
            'website',
            websiteId.toString(),
            'parent',
            `team:${payload.teamId}`,
          ),
        ) || [];
      await this.fgaService.createBatchesRelationships(tuples);
    },
    [AUTHORIZATION_ACTION.TEAM_REMOVE_WEBSITE]: async (payload: TeamsPayload) => {
      const tuples: FgaTupleEnquire<any>[] =
        payload.websiteIds?.map((websiteId) =>
          this.fgaService.makeFgaTuple(
            'website',
            websiteId.toString(),
            'parent',
            `team:${payload.teamId}`,
          ),
        ) || [];
      await this.fgaService.deleteBatchesRelationships(tuples);
    },

    [AUTHORIZATION_ACTION.USER_ADD_WEBSITE]: async (payload: WebsiteUserPayload) => {
      await Promise.all(
        payload.websiteIds.map((websiteId) =>
          this.fgaService.removeUserRelations(
            'website',
            payload.userId.toString(),
            websiteId.toString(),
            ['viewer', 'editor', 'manager'],
          ),
        ),
      );

      const tuples = payload.websiteIds.map((websiteId) =>
        this.fgaService.makeFgaTuple(
          'website',
          websiteId.toString(),
          payload.permission,
          `user:${payload.userId}`,
        ),
      );
      await this.fgaService.createBatchesRelationships(tuples);
    },

    [AUTHORIZATION_ACTION.USER_REMOVE_WEBSITE]: async (payload: WebsiteUserPayload) => {
      await Promise.all(
        payload.websiteIds.map((websiteId) =>
          this.fgaService.removeUserRelations(
            'website',
            payload.userId.toString(),
            websiteId.toString(),
            ['viewer', 'editor', 'manager'],
          ),
        ),
      );
    },
    [AUTHORIZATION_ACTION.WEBSITE_CREATE]: async (payload: WebsiteCreatePayload) => {
      await this.fgaService.createRelationship(
        this.fgaService.makeFgaTuple(
          'website',
          payload.resourceId.toString(),
          'admin_role',
          `role:ams`,
        ),
      );
    },
    [AUTHORIZATION_ACTION.WEBSITE_DELETE]: async (payload: WebsitePayload) => {
      await Promise.all(
        payload.websiteIds.map((id) => this.fgaService.deleteResourceTuples(`website:${id}`)),
      );
    },
  };

  async execute<K extends keyof RegistryHandlers>(
    type: K,
    payload: RegistryHandlers[K],
  ): Promise<void> {
    const handler = this.registry[type];
    if (!handler) throw new Error(`No handler for resource: ${type}`);
    await handler(payload);
  }
}
