import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { WebsiteQueryRequestDTO } from './dto/request/query/website-query-request.dto';
import { WebsiteService } from './website.service';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { UpdateWebsiteDto } from './dto/update-website.dto';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { WebsiteDocs } from './website.swagger';
import { DeleteBulkWebsiteDto } from './dto/delete-bulk-website.dto';
import { UpdateWebsiteContextDto } from './dto/update.website-context.dto';
import { ContextFilterGuard } from 'src/core/authorization/guards/context.guard';
import { AMS_ROLE_EDITOR, AMS_ROLE_MANAGER } from 'src/core/authorization/policies/role.policies';
import { WebsiteDetailDTO } from './dto/website-detail.dto';
import { UpdateUrlWebsiteDto } from './dto/update-url-website.dto';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@WebsiteDocs.controller()
@Controller('websites')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @WebsiteDocs.findAll()
  @UseGuards(ContextFilterGuard)
  @Get()
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
  })
  async findAll(@Query() queryDto: WebsiteQueryRequestDTO, @CurrentUser() user: AuthenticatedUser) {
    return this.websiteService.findMany(queryDto, queryDto.contexts, { user });
  }

  @WebsiteDocs.findOne()
  @Get(':websiteId')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
    fga: {
      objectType: 'website',
      action: 'can_view',
      resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
    },
  })
  async findOne(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WebsiteDetailDTO> {
    return this.websiteService.findOne(websiteId, { user });
  }

  @WebsiteDocs.create()
  @Post()
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_MANAGER,
  })
  async create(@Body() dto: CreateWebsiteDto, @CurrentUser() user: AuthenticatedUser) {
    return this.websiteService.createWebsite(dto, { user });
  }

  @WebsiteDocs.update()
  @Patch(':websiteId')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_EDITOR,
  })
  async update(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Body() dto: UpdateWebsiteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.websiteService.update(websiteId, dto, { user });
  }

  @WebsiteDocs.changeWebsiteUrl()
  @Patch(':websiteId/url')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_MANAGER,
  })
  async changeWebsiteUrl(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Body() updateUrlWebsiteDto: UpdateUrlWebsiteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.websiteService.changeWebsiteUrl(websiteId, updateUrlWebsiteDto.baseUrl, { user });
  }

  @WebsiteDocs.delete()
  @Delete()
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_MANAGER,
  })
  async delete(
    @Body() deleteBulkDto: DeleteBulkWebsiteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.websiteService.delete(deleteBulkDto.websiteIds, { user });
  }

  @WebsiteDocs.changeWebsiteContexts()
  @Post(':websiteId/contexts')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_MANAGER,
  })
  async changeWebsiteContexts(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Body('contexts') updateWebsiteContextDto: UpdateWebsiteContextDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.websiteService.changeWebsiteContexts(
      websiteId,
      updateWebsiteContextDto.contexts,
      user.id,
    );
  }
}
