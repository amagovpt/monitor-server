import { Controller, Patch, Body, HttpStatus, HttpCode, Param, UseGuards, ParseIntPipe, Get } from "@nestjs/common";
import { DirectoryTagsService } from "./directory-tags.service";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { RoleSlug ,AuthenticatedUser} from "src/core/authentication/interfaces/types";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { DirectoryTagsDocs } from "./directory-tags.swagger";
import { FgaGuard } from "src/core/authorization/guards/fga.guard";
import { FgaAuthorized } from "src/core/authorization/decorators/fga-authorization.decorator";
import { UpdateDirectoryTagsDto } from "./dtos/directory-tags-update.dto";
import { AMS_ROLE_EDITOR, AMS_ROLE_VIEWER } from "src/core/authorization/policies/role.policies";
import { DirectoryTagsResponseDTO } from "./dtos/directory-tags-response.dto";

@DirectoryTagsDocs.controller()
@Controller("directory/:directoryId/tags") 
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
export class DirectoryTagsController {
  constructor(private readonly orchestrator: DirectoryTagsService) {}

  @Get('')
  @FgaAuthorized(AMS_ROLE_VIEWER)
  @Roles(RoleSlug.ADMIN)
  @DirectoryTagsDocs.getDirectoryTags()
  @HttpCode(HttpStatus.OK)
  async getDirectoryTags(
    @Param("directoryId", ParseIntPipe) directoryId: number
  ): Promise<DirectoryTagsResponseDTO> {
    return await this.orchestrator.getTagsOnDirectory(directoryId);
  }



  @Patch()
  @FgaAuthorized(AMS_ROLE_EDITOR)
  @Roles(RoleSlug.ADMIN)
  @DirectoryTagsDocs.updateDirectoryTags()
  @HttpCode(HttpStatus.OK)
  async updateTags(
    @CurrentUser() user: AuthenticatedUser,
    @Param("directoryId", ParseIntPipe) directoryId: number,
    @Body() dto: UpdateDirectoryTagsDto
  ) {
    return await this.orchestrator.updateTagsOnDirectory(
      directoryId,
      dto.add || [],
      dto.remove || [],
      user.id
    );
  }
}
