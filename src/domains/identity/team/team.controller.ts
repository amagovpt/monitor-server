import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  Body,
  Query,
  Delete,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import { LoggingInterceptor } from 'src/core/log/log.interceptor';
import { TeamDocs } from './team.swagger';
import { TeamService } from './team.service';
import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { CreateTeamDTO } from './dto/create-team.dto';
import { TeamDTO } from './dto/team.dto';
import { TeamQueryDTO } from './dto/request/team-request.dto';
import { PaginationResponse } from 'src/common/repositories/base.repository';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@TeamDocs.controller()
@Controller('teams')
@UseInterceptors(LoggingInterceptor)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}
  @TeamDocs.createTeam()
  @Post()
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_manage_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async createTeam(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createTeamDTO: CreateTeamDTO,
  ): Promise<TeamDTO> {
    return await this.teamService.createTeam(user, createTeamDTO);
  }

  @TeamDocs.getTeamById()
  @Get(':id')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_view_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async getTeamById(@Param('id', ParseIntPipe) id: number): Promise<TeamDTO> {
    return await this.teamService.getTeamById(id);
  }

  @TeamDocs.getAllTeams()
  @Get()
  @Protected({
    roles: [RoleSlug.ADMIN],
  })
  async getAllTeams(
    @Query() query: TeamQueryDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginationResponse<TeamDTO>> {
    return await this.teamService.getAllTeams(query, { user });
  }
  @TeamDocs.deleteTeam()
  @Delete(':id')
  @HttpCode(204)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_manage_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async deleteTeam(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.teamService.deleteTeam(id);
  }
}
