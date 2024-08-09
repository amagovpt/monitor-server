import {
  Controller,
  Param,
  Request,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CrawlerService } from "./crawler.service";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiResponse,
  ApiTags,
  ApiOperation,
} from "@nestjs/swagger";
import { CrawlWebsite } from "./crawler.entity";
import { CrawlerConfig } from "./dto/crawler-config.dto";
import { CrawlerCreate } from "./dto/crawler-create.dto";
import { CrawlerTags } from "./dto/crawler-tags.dto";
import { CrawlerUserWebsite } from "./dto/crawler-user-website.dto";
import { CrawlerDelete } from "./dto/crawler-delete.dto";
import { CrawlerDeleteBulk } from "./dto/crawler-delete-bulk.dto";

@ApiBasicAuth()
@ApiTags("directory")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("crawler")
@UseInterceptors(LoggingInterceptor)
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @ApiOperation({ summary: "Find all crawl website" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<CrawlWebsite>,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all")
  async getAll(): Promise<any> {
    return success(await this.crawlerService.findAll());
  }

  @ApiOperation({ summary: "Find  the crawler config" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("config")
  getConfig(): Promise<any> {
    return success(this.crawlerService.getConfig());
  }

  @ApiOperation({ summary: "Change the crawler config" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("setConfig")
  setConfig(@Body() crawlerConfig: CrawlerConfig): Promise<any> {
    const maxDepth = crawlerConfig.maxDepth;
    const maxPages = crawlerConfig.maxPages;
    return success(this.crawlerService.setConfig(maxDepth, maxPages));
  }

  @ApiOperation({ summary: "Change the crawler config" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("crawl")
  async crawlWebsite(@Body() crawlerCreate: CrawlerCreate): Promise<any> {
    const websites = crawlerCreate.websites;
    const maxDepth = crawlerCreate.maxDepth;
    const maxPages = crawlerCreate.maxPages;
    const waitJS = crawlerCreate.waitJS;

    return success(
      await this.crawlerService.crawlWebsite(
        -1,
        websites,
        maxDepth,
        maxPages,
        waitJS,
        0
      )
    );
  }

  @ApiOperation({ summary: "Crawl all websites in a list of tags" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("tags")
  async crawlTags(@Body() crawlerTags: CrawlerTags): Promise<any> {
    const tagsId = crawlerTags.tagsId;
    return success(await this.crawlerService.crawlTags(tagsId));
  }

  @ApiOperation({ summary: "Crawl user website(My Monitor)" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("crawlUser")
  async crawlUserPage(
    @Request() req: any,
    @Body() crawlerUserWebsite: CrawlerUserWebsite
  ): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = crawlerUserWebsite.website;
    const websiteId = await this.crawlerService.getWebsiteId(
      userId,
      websiteUrl
    );

    return success(
      await this.crawlerService.crawlWebsite(
        userId,
        [{ url: websiteUrl, websiteId }],
        0,
        0,
        0,
        0
      )
    );
  }

  @ApiOperation({ summary: "Check user crawl from a specific website" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("crawlUserCheck")
  async checkCrawlUserPage(
    @Request() req: any,
    @Body() crawlerUserWebsite: CrawlerUserWebsite
  ): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = crawlerUserWebsite.website;
    const websiteId = await this.crawlerService.getWebsiteId(
      userId,
      websiteUrl
    );

    return success(
      await this.crawlerService.isUserCrawlerDone(userId, websiteId)
    );
  }

  @ApiOperation({ summary: "Check user crawl results from a specific website" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("crawlUserResults")
  async getCrawlUserPageResults(
    @Request() req: any,
    @Body() crawlerUserWebsite: CrawlerUserWebsite
  ): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = crawlerUserWebsite.website;
    const websiteId = await this.crawlerService.getWebsiteId(
      userId,
      websiteUrl
    );

    return success(
      await this.crawlerService.getUserCrawlResults(userId, websiteId)
    );
  }

  @ApiOperation({ summary: "Delete user crawl from a specific website" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("crawlUserDelete")
  async deleteCrawlUserPage(
    @Request() req: any,
    @Body() crawlerUserWebsite: CrawlerUserWebsite
  ): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = crawlerUserWebsite.website;
    const websiteId = await this.crawlerService.getWebsiteId(
      userId,
      websiteUrl
    );

    return success(
      await this.crawlerService.deleteUserCrawler(userId, websiteId)
    );
  }

  @ApiOperation({ summary: "Crawl user website(Study Monitor)" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-study"))
  @Post("crawlStudiesUser")
  async crawlStudiesUserPage(
    @Request() req: any,
    @Body() crawlerUserWebsite: CrawlerUserWebsite
  ): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = crawlerUserWebsite.website;
    const websiteId = await this.crawlerService.getWebsiteId(
      userId,
      websiteUrl
    );

    return success(
      await this.crawlerService.crawlWebsite(
        userId,
        [{ url: websiteUrl, websiteId }],
        0,
        0,
        0,
        0
      )
    );
  }

  @ApiOperation({
    summary: "Check user crawl results from a specific website(Study Monitor)",
  })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-study"))
  @Post("crawlStudiesUserCheck")
  async checkStudiesCrawlUserPage(
    @Request() req: any,
    @Body() crawlerUserWebsite: CrawlerUserWebsite
  ): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = crawlerUserWebsite.website;
    const websiteId = await this.crawlerService.getWebsiteId(
      userId,
      websiteUrl
    );

    return success(
      await this.crawlerService.isUserCrawlerDone(userId, websiteId)
    );
  }

  @ApiOperation({ summary: "Find crawl results from a specific tag" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-study"))
  @Get("tag/:tagName")
  async getCrawlStudiesUserTagWebsites(
    @Param("tagName") tagName: string,
    @Request() req: any
  ): Promise<any> {
    const userId = req.user.userId;
    return success(
      await this.crawlerService.getUserTagWebsitesCrawlResults(
        userId,
        decodeURIComponent(tagName)
      )
    );
  }

  @ApiOperation({ summary: "Check user crawl results from a specific website" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-study"))
  @Post("crawlStudiesUserResults")
  async getCrawlStudiesUserPageResults(
    @Request() req: any,
    @Body() crawlerUserWebsite: CrawlerUserWebsite
  ): Promise<any> {
    const userId = req.user.userId;
    const websiteId = crawlerUserWebsite.websiteId;

    return success(
      await this.crawlerService.getUserCrawlResults(userId, websiteId)
    );
  }

  @ApiOperation({
    summary: "Delete user crawl from a specific website(Study Monitor)",
  })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-study"))
  @Post("crawlStudiesUserDelete")
  async deleteCrawlStudiesUserPage(
    @Request() req: any,
    @Body() crawlerUserWebsite: CrawlerUserWebsite
  ): Promise<any> {
    const userId = req.user.userId;
    const websiteId = crawlerUserWebsite.websiteId;

    return success(
      await this.crawlerService.deleteUserCrawler(userId, websiteId)
    );
  }

  @ApiOperation({ summary: "Delete specific crawl" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("delete")
  async deleteCrawl(@Body() crawlerDelete: CrawlerDelete): Promise<any> {
    const crawlWebsiteId = crawlerDelete.crawlWebsiteId;

    return success(await this.crawlerService.delete(crawlWebsiteId));
  }

  @ApiOperation({ summary: "Delete list of crawls" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("deleteBulk")
  async deleteCrawlers(
    @Body() crawlerDeleteBulk: CrawlerDeleteBulk
  ): Promise<any> {
    const crawlWebsiteIds = crawlerDeleteBulk.crawlWebsiteIds;

    return success(await this.crawlerService.deleteBulk(crawlWebsiteIds));
  }

  @ApiOperation({ summary: "Find crawl website by id" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("getByCrawlWebsiteID/:crawlWebsiteId")
  async getCrawlResultsCrawlWebsiteID(
    @Param("crawlWebsiteId") crawlWebsiteId: string
  ): Promise<any> {
    return success(
      await this.crawlerService.getCrawlResultsByCrawlWebsiteID(
        parseInt(crawlWebsiteId)
      )
    );
  }
}
