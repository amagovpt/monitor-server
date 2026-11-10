import { Controller, Patch, Body, HttpStatus, HttpCode, Param, UseGuards, ParseIntPipe, Get } from "@nestjs/common";
import { UserWebsitesService } from "./user-websites.service";
import { UpdateUserWebsitesDto } from "./dtos/user-website-update.dto";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { RoleSlug } from "src/core/authentication/interfaces/types";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { UserWebsitesDocs } from "./user-websites.swagger";
import { FgaGuard } from "src/core/authorization/guards/fga.guard";
import { FgaAuthorized } from "src/core/authorization/decorators/fga-authorization.decorator";
import { AMS_ROLE_EDITOR, AMS_ROLE_VIEWER } from "src/core/authorization/policies/role.policies";
import { UserWebsitesResponseDTO } from "./dtos/user-websites-response.dto";

@UserWebsitesDocs.controller()
@Controller("users/:userId/websites")
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
export class UserWebsitesController {
  constructor(private readonly service: UserWebsitesService) {}


  @Get('')
  @UserWebsitesDocs.getUserWebsites()
  @FgaAuthorized(AMS_ROLE_VIEWER)
  @HttpCode(HttpStatus.OK)
  async getUserWebsites(
    @Param("userId", ParseIntPipe) userId: number): Promise<UserWebsitesResponseDTO> {
        return await this.service.getUserWebsites(userId);
  }
  
  @Patch()
  @UserWebsitesDocs.updateUserWebsites()
  @FgaAuthorized(AMS_ROLE_EDITOR)
  @Roles(RoleSlug.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateWebsites(
    @Param("userId", ParseIntPipe) userId: number,
    @Body() dto: UpdateUserWebsitesDto
  ) {
    return await this.service.updateUserWebsites(
      userId, 
      dto.add || [], 
      dto.remove || []
    );
  }
}
