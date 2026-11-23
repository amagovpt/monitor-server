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
import { TagWebsitesService } from './tag-website.service';
import { UpdateWebsiteTagsDto } from './dtos/tag-website-update.dto';
import { RoleSlug, AuthenticatedUser } from 'src/core/authentication/interfaces/types';
import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { TagWebsitesDocs } from './tag-website.swagger';
import { AMS_ROLE_EDITOR } from 'src/core/authorization/policies/role.policies';
import { TagWebsitesResponseDTO } from './dtos/tag-websites-response.dto';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@TagWebsitesDocs.controller()
@Controller('websites/:websiteId/tags') // Rota RESTful consolidada
export class TagWebsitesController {
  constructor(private readonly orchestrator: TagWebsitesService) {}

  @Get('')
  @TagWebsitesDocs.getWebsiteTags()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_view_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async getWebsiteTags(
    @Param('websiteId', ParseIntPipe) websiteId: number,
  ): Promise<TagWebsitesResponseDTO> {
    return await this.orchestrator.getTagsOnWebsite(websiteId);
  }

  @Patch()
  @TagWebsitesDocs.updateWebsiteTags()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_EDITOR,
  })
  async updateTags(
    @CurrentUser() user: AuthenticatedUser,
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Body() dto: UpdateWebsiteTagsDto,
  ) {
    return await this.orchestrator.updateTagsOnWebsite(
      websiteId,
      dto.add || [],
      dto.remove || [],
      user.id,
    );
  }
}
