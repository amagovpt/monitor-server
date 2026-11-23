import {
  Controller,
  Patch,
  Body,
  HttpStatus,
  HttpCode,
  Param,
  ParseIntPipe,
  Get,
} from '@nestjs/common';
import { AMS_ROLE_VIEWER } from 'src/core/authorization/policies/role.policies';
import { TeamMembersService } from './team-members.service';
import { UpdateTeamMembersDto } from './dtos/tag-members-update.dto';
import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { TeamMembersDocs } from './team-members.swagger';
import { FgaAuthorized } from 'src/core/authorization/decorators/fga-authorization.decorator';
import { AMS_ROLE_EDITOR } from 'src/core/authorization/policies/role.policies';
import { TeamMembersResponseDTO } from './dtos/team-members-response.dto';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@TeamMembersDocs.controller()
@Controller('teams/:teamId/members')
export class TeamMembersController {
  constructor(private readonly service: TeamMembersService) {}

  @Get('')
  @TeamMembersDocs.getTeamMembers()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
    fga: AMS_ROLE_VIEWER,
  })
  async getTeamMembers(
    @Param('teamId', ParseIntPipe) teamId: number,
  ): Promise<TeamMembersResponseDTO> {
    return await this.service.getTeamMembers(teamId);
  }

  @Patch()
  @TeamMembersDocs.updateTeamMembers()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_EDITOR,
  })
  async updateMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() dto: UpdateTeamMembersDto,
  ) {
    return await this.service.updateTeamMembers(teamId, dto.add || [], dto.remove || []);
  }
}
