import { FGA_RESOURCE } from '../types/fga.types';

export const AUTHORIZATION_ACTION = {
  USER_CREATE: `${FGA_RESOURCE.USER}:createUser`,
  USER_DELETE: `${FGA_RESOURCE.USER}:deleteUser`,
  USER_UPDATE: `${FGA_RESOURCE.USER}:updateUser`,

  // Team
  TEAM_CREATE: `${FGA_RESOURCE.TEAM}:create`,
  TEAM_DELETE: `${FGA_RESOURCE.TEAM}:delete`,
  TEAM_ADD_MEMBER: `${FGA_RESOURCE.TEAM}:addTeamMember`,
  TEAM_REMOVE_MEMBER: `${FGA_RESOURCE.TEAM}:removeTeamMember`,
  TEAM_ADD_WEBSITE: `${FGA_RESOURCE.TEAM}:addTeamWebsite`,
  TEAM_REMOVE_WEBSITE: `${FGA_RESOURCE.TEAM}:removeTeamWebsite`,

  // User_Website allocation
  USER_ADD_WEBSITE: `${FGA_RESOURCE.USER}:addUserWebsite`,
  USER_REMOVE_WEBSITE: `${FGA_RESOURCE.USER}:removeUserWebsite`,

  // Website
  WEBSITE_CREATE: `${FGA_RESOURCE.WEBSITE}:createWebsite`,
  WEBSITE_DELETE: `${FGA_RESOURCE.WEBSITE}:deleteWebsite`,
} as const;

export type RegistryKey = (typeof AUTHORIZATION_ACTION)[keyof typeof AUTHORIZATION_ACTION];
