import { Controller, Get, Post, Body, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CrawlerWebsiteService } from './crawler-website.service';

import { CrawlerCreateDTO } from './dto/crawler-create.dto';
import { CrawlerDelete as CrawlerDeleteDTO } from './dto/crawler-delete.dto';
import { CrawlerRequestDTO } from './dto/request/cralwer-request.dto';

import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { SecurityContext } from 'src/core/authorization/SecurityContext';

import { DiscoveryDocs } from './crawler-website.swagger';
import { CrawlerImportDTO } from './dto/crawler-import.dto';
import { CrawlerTagsCreateDTO } from './dto/crawler-create-tags.dto';
import { CrawlWebsitesResponseDTO } from './dto/crawler-website-response.dto';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@DiscoveryDocs.controller()
@Controller('discovery')
export class CrawlerWebsiteController {
  constructor(private readonly crawlerWebsiteService: CrawlerWebsiteService) {}

  @DiscoveryDocs.getCrawlWebsites()
  @Get('')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
  })
  async getCrawlWebsites(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CrawlerRequestDTO,
  ): Promise<CrawlWebsitesResponseDTO> {
    const securityContext: SecurityContext = { user };
    return await this.crawlerWebsiteService.getMany(query, securityContext);
  }

  @DiscoveryDocs.importCrawlers()
  @HttpCode(HttpStatus.OK)
  @Post('import')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
  })
  async importCrawlers(
    @CurrentUser() user: AuthenticatedUser,
    @Body() crawlerImport: CrawlerImportDTO,
  ): Promise<void> {
    const securityContext: SecurityContext = { user };
    await this.crawlerWebsiteService.importCrawlers(securityContext, crawlerImport.crawlerIds);
  }

  @DiscoveryDocs.crawlWebsite()
  @Post('')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
  })
  async crawlWebsite(
    @Body() crawlerCreate: CrawlerCreateDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const securityContext: SecurityContext = { user };

    return await this.crawlerWebsiteService.crawlWebsites(
      securityContext,
      crawlerCreate.websitesId,
      {
        maxDepth: crawlerCreate.maxDepth,
        maxPages: crawlerCreate.maxPages,
        waitJS: crawlerCreate.waitJS,
      },
    );
  }
  @DiscoveryDocs.crawlWebsiteTags()
  @Post('tags')
  @Protected({
    roles: [RoleSlug.ADMIN],
  })
  async crawlWebsiteTags(
    @Body() crawlerCreate: CrawlerTagsCreateDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const securityContext: SecurityContext = { user };

    await this.crawlerWebsiteService.crawlWebsitesTags(securityContext, crawlerCreate.tagsId, {
      maxDepth: crawlerCreate.maxDepth,
      maxPages: crawlerCreate.maxPages,
      waitJS: crawlerCreate.waitJS,
    });
  }

  @DiscoveryDocs.deleteCrawler()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
  })
  async deleteManyCrawlers(
    @CurrentUser() user: AuthenticatedUser,
    @Body() crawlerDelete: CrawlerDeleteDTO,
  ): Promise<void> {
    const securityContext: SecurityContext = { user };
    await this.crawlerWebsiteService.deleteMany(securityContext, crawlerDelete.ids);
  }
}
