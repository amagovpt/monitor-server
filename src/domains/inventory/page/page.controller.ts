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
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PageService } from './page.service';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { Roles } from 'src/core/authorization/decorators/roles.decorator';
import { RolesGuard } from 'src/core/authorization/guards/roles.guard';
import { CreatePageDto } from './dto/create-page.dto';
import { PageQueryRequestDTO } from './dto/request/query/page-query-request.dto';
import { LoggableController } from 'src/common/controllers/loggable.interface';
import { JwtAuthGuard } from 'src/core/authentication/guards/jwt-auth.guard';
import { ContextFilterGuard } from 'src/core/authorization/guards/context.guard';
import { FgaGuard } from 'src/core/authorization/guards/fga.guard';
import { FgaAuthorized } from 'src/core/authorization/decorators/fga-authorization.decorator';
import { UpdatePageContextDto } from './dto/update.page-context.dto';
import { ContextMapByRole } from '../context/context.enum';
import { PageDocs } from './page.swagger';
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
@Controller('pages')
export class PageController implements LoggableController {
  readonly logger = new Logger('PageController');
  constructor(private readonly pageService: PageService) {}

  @Roles(RoleSlug.ADMIN, RoleSlug.MONITOR)
  @UseGuards(ContextFilterGuard)
  @PageDocs.find()
  @Get()
  async find(@CurrentUser() user: AuthenticatedUser, @Query() query: PageQueryRequestDTO) {
    return this.pageService.findAll(
      {
        pagination: { limit: query.pagination?.limit, page: query.pagination?.page },
        sortings: query.sorts,
        filters: query.filters,
      },
      query.contexts,
      { user },
    );
  }

  @Roles(RoleSlug.ADMIN, RoleSlug.MONITOR)
  @FgaAuthorized({
    objectType: 'website',
    action: 'can_view',
    resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
  })
  @PageDocs.findOne()
  @Get('website/:websiteId/page/:pageId')
  async findOne(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pageService.findPageById(websiteId, pageId, { user });
  }

  @Roles(RoleSlug.ADMIN, RoleSlug.MONITOR)
  @FgaAuthorized({
    objectType: 'website',
    action: 'can_edit',
    resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
  })
  @PageDocs.create()
  @Post('website/:websiteId/page')
  async create(@Body() dto: CreatePageDto, @CurrentUser() user: AuthenticatedUser) {
    return this.pageService.create(dto, { user });
  }

  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized({
    objectType: 'role',
    action: 'can_manage_users',
    resourceIdResolver: () => 'ams',
  })
  @PageDocs.bulkDelete()
  @Delete('')
  async bulkDelete(@Body('ids') ids: number[], @CurrentUser() user: AuthenticatedUser) {
    // strategy depends if is allocated to more than one context, if so, remove only the context, if not, delete the page
    const contextUser = ContextMapByRole[user.role_slug];
    if (!contextUser) {
      throw new BadRequestException('User role does not have an associated context');
    }

    return this.pageService.handlePageRemoval(ids, { user });
  }

  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized({
    objectType: 'role',
    action: 'can_manage_users',
    resourceIdResolver: () => 'ams',
  })
  @PageDocs.changePageContext()
  @Post('contexts')
  async changePageContext(
    @Body('contexts') updatePageContextDto: UpdatePageContextDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pageService.changePageContexts(
      updatePageContextDto.pageIds,
      updatePageContextDto.contexts,
      { user },
    );
  }

  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized({
    objectType: 'role',
    action: 'can_manage_users',
    resourceIdResolver: () => 'ams',
  })
  @Post('website/:websiteId/page/:pageId/toggle-observatory')
  async toggleObservatoryStatus(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pageService.toggleObservatoryStatus(websiteId, pageId, { user });
  }
}
