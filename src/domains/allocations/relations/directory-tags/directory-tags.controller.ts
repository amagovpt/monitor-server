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
import { DirectoryTagsService } from './directory-tags.service';
import { RoleSlug, AuthenticatedUser } from 'src/core/authentication/interfaces/types';
import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { DirectoryTagsDocs } from './directory-tags.swagger';
import { UpdateDirectoryTagsDto } from './dtos/directory-tags-update.dto';
import { AMS_ROLE_EDITOR, AMS_ROLE_VIEWER } from 'src/core/authorization/policies/role.policies';
import { DirectoryTagsResponseDTO } from './dtos/directory-tags-response.dto';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@DirectoryTagsDocs.controller()
@Controller('directory/:directoryId/tags')
export class DirectoryTagsController {
  constructor(private readonly orchestrator: DirectoryTagsService) {}

  @Get('')
  @DirectoryTagsDocs.getDirectoryTags()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_VIEWER,
  })
  async getDirectoryTags(
    @Param('directoryId', ParseIntPipe) directoryId: number,
  ): Promise<DirectoryTagsResponseDTO> {
    return await this.orchestrator.getTagsOnDirectory(directoryId);
  }

  @Patch()
  @DirectoryTagsDocs.updateDirectoryTags()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_EDITOR,
  })
  async updateTags(
    @CurrentUser() user: AuthenticatedUser,
    @Param('directoryId', ParseIntPipe) directoryId: number,
    @Body() dto: UpdateDirectoryTagsDto,
  ) {
    return await this.orchestrator.updateTagsOnDirectory(
      directoryId,
      dto.add || [],
      dto.remove || [],
      user.id,
    );
  }
}
