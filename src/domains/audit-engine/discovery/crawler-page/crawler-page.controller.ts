import {
  Controller,
  Get,
  UseGuards,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Param,
  Query,
  Post,
} from '@nestjs/common';
import { CrawlerPageService } from './crawler-page.service';

import { CrawlerPageDeleteDTO } from './dto/crawler-page-delete.dto';

import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { SecurityContext } from 'src/core/authorization/SecurityContext';

import { DiscoveryDocs } from './crawl-page.swagger';
import { RolesGuard } from 'src/core/authorization/guards/roles.guard';
import { JwtAuthGuard } from 'src/core/authentication/guards/jwt-auth.guard';
import { Roles } from 'src/core/authorization/decorators/roles.decorator';
import { FgaGuard } from 'src/core/authorization/guards/fga.guard';
import { CrawlPagesResponseDTO } from './dto/crawler-page-response.dto';
import { FgaAuthorized } from 'src/core/authorization/decorators/fga-authorization.decorator';
import { CrawlerPageImportDTO } from './dto/crawler-page-import.dto';
import { CrawlerRequestDTO } from './dto/request/cralwer-request.dto';

@DiscoveryDocs.controller()
@Controller('discovery/websites/:websiteId/crawler/:crawlerId')
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
export class CrawlerPageController {
  constructor(private readonly crawlerPageService: CrawlerPageService) {}

  @DiscoveryDocs.getCrawlPages()
  @FgaAuthorized({
    objectType: 'website',
    action: 'can_view',
    resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
  })
  @Roles(RoleSlug.ADMIN, RoleSlug.MONITOR)
  @Get('')
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
  @Roles(RoleSlug.ADMIN, RoleSlug.MONITOR)
  @FgaAuthorized({
    objectType: 'website',
    action: 'can_edit',
    resourceIdResolver: (ctx) => ctx.switchToHttp().getRequest().params.websiteId,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('')
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
