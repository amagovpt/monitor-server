import { RoleSlug } from 'src/core/authentication/interfaces/types';
import { AUTHORIZATION_ACTION, RegistryKey } from '../registry/registry.keys';
import { AssignationRelationType, FGA_RESOURCE, ResourceType } from '../types/fga.types';

export const AuthorizationEvent = {
  AUTHORIZATION: 'authorization',
} as const;

export type AuthorizationEventType = (typeof AuthorizationEvent)[keyof typeof AuthorizationEvent];

export interface PublishEventAuthOptions<T extends keyof RegistryHandlers> {
  aggregateType: string;
  aggregateId: number;
  action: RegistryKey;
  eventType: AuthorizationEventType;
  payload: RegistryHandlers[T];
}

export type RegistryHandlers = {
  [AUTHORIZATION_ACTION.USER_CREATE]: UserPayload;
  [AUTHORIZATION_ACTION.USER_DELETE]: UserPayload;
  [AUTHORIZATION_ACTION.USER_UPDATE]: UserPayload;
  [AUTHORIZATION_ACTION.TEAM_CREATE]: TeamsPayload;
  [AUTHORIZATION_ACTION.TEAM_DELETE]: TeamsPayload;
  [AUTHORIZATION_ACTION.TEAM_ADD_MEMBER]: TeamsPayload;
  [AUTHORIZATION_ACTION.TEAM_REMOVE_MEMBER]: TeamsPayload;
  [AUTHORIZATION_ACTION.TEAM_ADD_WEBSITE]: TeamsPayload;
  [AUTHORIZATION_ACTION.TEAM_REMOVE_WEBSITE]: TeamsPayload;
  [AUTHORIZATION_ACTION.USER_ADD_WEBSITE]: WebsiteUserPayload;
  [AUTHORIZATION_ACTION.USER_REMOVE_WEBSITE]: WebsiteUserPayload;
  [AUTHORIZATION_ACTION.WEBSITE_CREATE]: WebsiteCreatePayload;
  [AUTHORIZATION_ACTION.WEBSITE_DELETE]: WebsitePayload;
};

export type AuthPayload = TeamsPayload | WebsitePayload | UserPayload | WebsiteUserPayload;

export interface BaseAuthPayload<T extends ResourceType> {
  resourceType: T;
  resourceId: number;
  action: RegistryKey;
}
export type PermissionKey = 'manager' | 'viewer' | 'editor';

export const MapPermissionsRoles: Record<
  PermissionKey,
  AssignationRelationType[typeof FGA_RESOURCE.ROLE]
> = {
  manager: 'manager',
  viewer: 'viewer',
  editor: 'editor',
};

export interface UserPayload extends BaseAuthPayload<typeof FGA_RESOURCE.USER> {
  resourceType: typeof FGA_RESOURCE.USER;
  userId: number;
  role: RoleSlug;
  newRole?: RoleSlug;
  permission: PermissionKey;
  newPermission?: PermissionKey;
}

export interface RoleUpdatePayload extends BaseAuthPayload<typeof FGA_RESOURCE.ROLE> {
  resourceType: typeof FGA_RESOURCE.ROLE;
  userId: number;
  oldRole: RoleSlug;
  newRole: RoleSlug;
  permission: PermissionKey;
}
export interface TeamsPayload extends BaseAuthPayload<typeof FGA_RESOURCE.TEAM> {
  resourceType: typeof FGA_RESOURCE.TEAM;
  teamId: number;
  websiteIds?: number[];
  userIds?: number[];
}

export interface WebsitePayload extends BaseAuthPayload<typeof FGA_RESOURCE.WEBSITE> {
  resourceType: typeof FGA_RESOURCE.WEBSITE;
  websiteIds: number[];
}

export interface WebsiteCreatePayload extends BaseAuthPayload<typeof FGA_RESOURCE.WEBSITE> {}

export interface WebsiteUserPayload extends BaseAuthPayload<typeof FGA_RESOURCE.WEBSITE> {
  resourceType: typeof FGA_RESOURCE.WEBSITE;
  userId: number;
  websiteIds: number[];
  permission: PermissionKey;
}
