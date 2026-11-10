import { Controller, Patch, Body, HttpStatus, HttpCode, Param, UseGuards, ParseIntPipe, Get } from "@nestjs/common";
import { TagWebsitesService } from "./tag-website.service";
import { UpdateWebsiteTagsDto } from "./dtos/tag-website-update.dto"; 
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { RoleSlug ,AuthenticatedUser} from "src/core/authentication/interfaces/types";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { TagWebsitesDocs } from "./tag-website.swagger";
import { FgaGuard } from "src/core/authorization/guards/fga.guard";
import { FgaAuthorized } from "src/core/authorization/decorators/fga-authorization.decorator";
import { AMS_ROLE_EDITOR } from "src/core/authorization/policies/role.policies";
import { TagWebsitesResponseDTO } from "./dtos/tag-websites-response.dto";

@TagWebsitesDocs.controller()
@Controller("websites/:websiteId/tags") // Rota RESTful consolidada
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
export class TagWebsitesController {
  constructor(private readonly orchestrator: TagWebsitesService) {}

  @Get('')
  @FgaAuthorized({
    objectType: "role",
    action: "can_view_users",
    resourceIdResolver: () => 'ams'
  })
  @TagWebsitesDocs.getWebsiteTags()
  @Roles(RoleSlug.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getWebsiteTags(
    @Param("websiteId", ParseIntPipe) websiteId: number
  ): Promise<TagWebsitesResponseDTO> {
    return await this.orchestrator.getTagsOnWebsite(websiteId);
  }



  @Patch()
  @TagWebsitesDocs.updateWebsiteTags()
  @FgaAuthorized(AMS_ROLE_EDITOR)
  @Roles(RoleSlug.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateTags(
    @CurrentUser() user: AuthenticatedUser,
    @Param("websiteId", ParseIntPipe) websiteId: number,
    @Body() dto: UpdateWebsiteTagsDto
  ) {
    return await this.orchestrator.updateTagsOnWebsite(
      websiteId,
      dto.add || [],
      dto.remove || [],
      user.id
    );
  }
}
