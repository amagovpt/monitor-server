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
import { RolesGuard } from 'src/core/authorization/guards/roles.guard';
import { Roles } from 'src/core/authorization/decorators/roles.decorator';
import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { TagRequestDTO } from './dto/request/tag-request.dto';
import { LoggableController } from 'src/common/controllers/loggable.interface';
import { CreateTagDTO } from './dto/create-tag.dto';
import { UpdateTagDTO } from './dto/update-tag.dto';
import { JwtAuthGuard } from 'src/core/authentication/guards/jwt-auth.guard';
import { ContextFilterGuard } from 'src/core/authorization/guards/context.guard';
import { FgaGuard } from 'src/core/authorization/guards/fga.guard';
import { FgaAuthorized } from 'src/core/authorization/decorators/fga-authorization.decorator';
import { PaginationResponse } from 'src/common/repositories/base.repository';
import {
  AMS_ROLE_EDITOR,
  AMS_ROLE_MANAGER,
  AMS_ROLE_VIEWER,
} from 'src/core/authorization/policies/role.policies';

@TagDocs.controller()
@Controller('tags')
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
@UseInterceptors(LoggingInterceptor)
export class TagController implements LoggableController {
  readonly logger = new Logger('TagController');
  constructor(private readonly tagService: TagService) {}

  @TagDocs.findAll()
  @Get('')
  @Roles(RoleSlug.ADMIN)
  @UseGuards(ContextFilterGuard)
  async findAllAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TagRequestDTO,
  ): Promise<PaginationResponse<TagResponseDTO>> {
    return await this.tagService.findAll(query);
  }

  @TagDocs.findOne()
  @Get(':id')
  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized(AMS_ROLE_VIEWER)
  async getTag(@CurrentUser() user: AuthenticatedUser, @Param('id') tagId: number): Promise<TagResponseDTO> {
    this.logger.log(`Fetching tag with ID: ${tagId} for user: ${user.id}`);
    return await this.tagService.findById(tagId);
  }

  @TagDocs.create()
  @Post('')
  @FgaAuthorized(AMS_ROLE_MANAGER)
  @Roles(RoleSlug.ADMIN)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createTagDto: CreateTagDTO,
  ): Promise<TagResponseDTO> {
    return await this.tagService.createOne(createTagDto, user);
  }

  @TagDocs.update()
  @Patch('')
  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized(AMS_ROLE_EDITOR)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateTagDto: UpdateTagDTO,
  ): Promise<TagResponseDTO> {
    return await this.tagService.update(updateTagDto, user);
  }

  @TagDocs.delete()
  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized(AMS_ROLE_MANAGER)
  @Delete(':id')
  @HttpCode(204)
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') tagId: number): Promise<void> {
    await this.tagService.deleteBulk([tagId]);
  }
}
