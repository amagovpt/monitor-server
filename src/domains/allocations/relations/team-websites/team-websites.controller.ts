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
import { TeamWebsitesService } from './team-websites.service';
import { UpdateTeamWebsitesDto } from './dtos/team-website-update.dto'; // DTO com { add: number[], remove: number[] }
import { RoleSlug } from 'src/core/authentication/interfaces/types';
import { TeamWebsitesDocs } from './team-websites.swagger';
import { AMS_ROLE_EDITOR, AMS_ROLE_VIEWER } from 'src/core/authorization/policies/role.policies';
import { TeamWebsitesResponseDTO } from './dtos/team-websites-response.dto';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@TeamWebsitesDocs.controller()
@Controller('teams/:teamId/websites')
export class TeamWebsitesController {
  constructor(private readonly service: TeamWebsitesService) {}

  @Get('')
  @TeamWebsitesDocs.getTeamWebsites()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
    fga: AMS_ROLE_VIEWER,
  })
  async getTeamWebsites(
    @Param('teamId', ParseIntPipe) teamId: number,
  ): Promise<TeamWebsitesResponseDTO> {
    return await this.service.getTeamWebsites(teamId);
  }

  @Patch()
  @TeamWebsitesDocs.updateTeamWebsites()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_EDITOR,
  })
  async updateWebsites(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() dto: UpdateTeamWebsitesDto,
  ) {
    return await this.service.updateTeamWebsites(teamId, dto.add || [], dto.remove || []);
  }
}
