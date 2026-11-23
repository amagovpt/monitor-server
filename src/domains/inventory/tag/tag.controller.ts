import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  Body,
  Patch,
  Delete,
  Query,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { Tag } from './tag.entity';
import { TagResponseDTO } from './dto/tag-response.dto';
import { LoggingInterceptor } from 'src/core/log/log.interceptor';

import { TagDocs } from './tag.swagger';
import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { TagRequestDTO } from './dto/request/tag-request.dto';
import { LoggableController } from 'src/common/controllers/loggable.interface';
import { CreateTagDTO } from './dto/create-tag.dto';
import { UpdateTagDTO } from './dto/update-tag.dto';
import { ContextFilterGuard } from 'src/core/authorization/guards/context.guard';
import { PaginationResponse } from 'src/common/repositories/base.repository';
import {
  AMS_ROLE_EDITOR,
  AMS_ROLE_MANAGER,
  AMS_ROLE_VIEWER,
} from 'src/core/authorization/policies/role.policies';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@TagDocs.controller()
@Controller('tags')
@UseInterceptors(LoggingInterceptor)
export class TagController implements LoggableController {
  readonly logger = new Logger('TagController');
  constructor(private readonly tagService: TagService) {}

  @TagDocs.findAll()
  @Get('')
  @UseGuards(ContextFilterGuard)
  @Protected({
    roles: [RoleSlug.ADMIN],
  })
  async findAllAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TagRequestDTO,
  ): Promise<PaginationResponse<TagResponseDTO>> {
    return await this.tagService.findAll(query);
  }

  @TagDocs.findOne()
  @Get(':id')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_VIEWER,
  })
  async getTag(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') tagId: number,
  ): Promise<TagResponseDTO> {
    this.logger.log(`Fetching tag with ID: ${tagId} for user: ${user.id}`);
    return await this.tagService.findById(tagId);
  }

  @TagDocs.create()
  @Post('')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_MANAGER,
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createTagDto: CreateTagDTO,
  ): Promise<TagResponseDTO> {
    return await this.tagService.createOne(createTagDto, user);
  }

  @TagDocs.update()
  @Patch('')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_EDITOR,
  })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateTagDto: UpdateTagDTO,
  ): Promise<TagResponseDTO> {
    return await this.tagService.update(updateTagDto, user);
  }

  @TagDocs.delete()
  @Delete(':id')
  @HttpCode(204)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_MANAGER,
  })
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') tagId: number): Promise<void> {
    await this.tagService.deleteBulk([tagId]);
  }
}
