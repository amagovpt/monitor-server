import { Controller, Get, Body, Delete, HttpCode, HttpStatus, ParseIntPipe, Param, Query, Post } from '@nestjs/common';
import { CrawlerPageService } from './crawler-page.service';

import { CrawlerPageDeleteDTO } from './dto/crawler-page-delete.dto';

import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { SecurityContext } from 'src/core/authorization/SecurityContext';

import { DiscoveryDocs } from './crawl-page.swagger';
import { CrawlPagesResponseDTO } from './dto/crawler-page-response.dto';
import { CrawlerPageImportDTO } from './dto/crawler-page-import.dto';
import { CrawlerRequestDTO } from './dto/request/cralwer-request.dto';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@DiscoveryDocs.controller()
@Controller('discovery/websites/:websiteId/crawler/:crawlerId')
export class CrawlerPageController {
  constructor(private readonly crawlerPageService: CrawlerPageService) {}

  @DiscoveryDocs.getCrawlPages()
  @Get('')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
    fga: {
      objectType: 'website',
      action: 'can_view',
      resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
    },
  })
  async getCrawlPages(
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('crawlerId', ParseIntPipe) crawlerId: number,
    @Query() query: CrawlerRequestDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CrawlPagesResponseDTO> {
    const securityContext: SecurityContext = { user };

    return await this.crawlerPageService.getCrawlPages(
      query,
      securityContext,
      websiteId,
      crawlerId,
    );
  }

  @DiscoveryDocs.deleteCrawlPages()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
    fga: {
      objectType: 'website',
      action: 'can_edit',
      resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
    },
  })
  async deleteCrawlPages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('crawlerId', ParseIntPipe) crawlerId: number,
    @Body() crawlerPageDeleteDTO: CrawlerPageDeleteDTO,
  ): Promise<void> {
    const securityContext: SecurityContext = { user };
    //
    await this.crawlerPageService.deleteCrawlerPages(
      securityContext,
      websiteId,
      crawlerId,
      crawlerPageDeleteDTO.crawlerPageIds,
    );
  }

  @DiscoveryDocs.importCrawlPages()
  @Post('pages')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
    fga: {
    objectType: 'website',
    action: 'can_edit',
    resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
  },
  })
  async importCrawlerPages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('websiteId', ParseIntPipe) websiteId: number,
    @Param('crawlerId', ParseIntPipe) crawlerId: number,
    @Body() crawlerPageImportDTO: CrawlerPageImportDTO,
  ): Promise<void> {
    const securityContext: SecurityContext = { user };
    return await this.crawlerPageService.importCrawlerPages(
      securityContext,
      websiteId,
      crawlerId,
      crawlerPageImportDTO.crawlerPageIds,
    );
  }
}
