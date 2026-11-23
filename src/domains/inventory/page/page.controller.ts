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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { PageService } from './page.service';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { CreatePageDto } from './dto/create-page.dto';
import { PageQueryRequestDTO } from './dto/request/query/page-query-request.dto';
import { LoggableController } from 'src/common/controllers/loggable.interface';
import { ContextFilterGuard } from 'src/core/authorization/guards/context.guard';
import { UpdatePageContextDto } from './dto/update.page-context.dto';
import { ContextMapByRole } from '../context/context.enum';
import { PageDocs } from './page.swagger';
import { DeletePagesDto } from './dto/delete-page.dto';
import { FileSitemapInterceptor } from './interceptors/file-sitemap.interceptor';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@Controller('pages')
export class PageController implements LoggableController {
  readonly logger = new Logger('PageController');
  constructor(private readonly pageService: PageService) {}

  @UseGuards(ContextFilterGuard)
  @PageDocs.find()
  @Get()
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
  })
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

  @PageDocs.findOne()
  @Get('website/:websiteId/page/:pageId')
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
    @Param('pageId', ParseIntPipe) pageId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pageService.findPageById(websiteId, pageId, { user });
  }

  @PageDocs.create()
  @Post('website/:websiteId/page')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
    fga: {
      objectType: 'website',
      action: 'can_edit',
      resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
    },
  })
  async create(@Body() dto: CreatePageDto, @CurrentUser() user: AuthenticatedUser) {
    return this.pageService.create(dto, { user });
  }

  @PageDocs.createFromSitemap()
  @UseInterceptors(FileSitemapInterceptor)
  @Post('website/:websiteId/sitemap')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
    fga: {
      objectType: 'website',
      action: 'can_edit',
      resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
    },
  })
  async createFromSitemap(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('A sitemap (xml) or txt file is required');
    }

    return this.pageService.createFromSitemap(websiteId, file, { user });
  }

  @PageDocs.bulkDelete()
  @Delete('')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_manage_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async bulkDelete(
    @Body() deletePagesDtos: DeletePagesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // strategy depends if is allocated to more than one context, if so, remove only the context, if not, delete the page
    const contextUser = ContextMapByRole[user.role_slug];
    if (!contextUser) {
      throw new BadRequestException('User role does not have an associated context');
    }

    return this.pageService.handlePageRemoval(deletePagesDtos.pageIds, { user });
  }

  @PageDocs.changePageContext()
  @Post('contexts')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_manage_users',
      resourceIdResolver: () => 'ams',
    },
  })
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

  @PageDocs.toggleObservatoryStatus()
  @Post('website/:websiteId/page/:pageId/toggle-observatory')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_manage_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async toggleObservatoryStatus(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pageService.toggleObservatoryStatus(websiteId, pageId, { user });
  }
}
