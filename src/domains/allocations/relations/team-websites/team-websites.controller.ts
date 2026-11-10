import { Controller, Patch, Body, HttpStatus, HttpCode, Param, UseGuards, ParseIntPipe, Get } from "@nestjs/common";
import { TeamWebsitesService } from "./team-websites.service";
import { UpdateTeamWebsitesDto } from "./dtos/team-website-update.dto"; // DTO com { add: number[], remove: number[] }
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { RoleSlug } from "src/core/authentication/interfaces/types";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { TeamWebsitesDocs } from "./team-websites.swagger";
import { FgaGuard } from "src/core/authorization/guards/fga.guard";
import { FgaAuthorized } from "src/core/authorization/decorators/fga-authorization.decorator";
import { AMS_ROLE_EDITOR, AMS_ROLE_VIEWER } from "src/core/authorization/policies/role.policies";
import { TeamWebsitesResponseDTO } from "./dtos/team-websites-response.dto";

@TeamWebsitesDocs.controller()
@Controller("teams/:teamId/websites") 
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
export class TeamWebsitesController {
  constructor(private readonly service: TeamWebsitesService) {}


  @Get('')
  @TeamWebsitesDocs.getTeamWebsites()
  @FgaAuthorized(AMS_ROLE_VIEWER)
  @HttpCode(HttpStatus.OK)
  async getTeamWebsites(
  @Param("teamId", ParseIntPipe) teamId: number): Promise<TeamWebsitesResponseDTO> {
        return await this.service.getTeamWebsites(teamId);
  }

  @Patch()
  @TeamWebsitesDocs.updateTeamWebsites()
  @FgaAuthorized(AMS_ROLE_EDITOR)
  @Roles(RoleSlug.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateWebsites(
    @Param("teamId", ParseIntPipe) teamId: number,
    @Body() dto: UpdateTeamWebsitesDto 
  ) {
    return await this.service.updateTeamWebsites(
      teamId, 
      dto.add || [], 
      dto.remove || []
    );
  }
}
