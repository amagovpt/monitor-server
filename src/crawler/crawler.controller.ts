import {
  Controller,
  Param,
  Request,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CrawlerService } from "./crawler.service";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";

@Controller("crawler")
@UseInterceptors(LoggingInterceptor)
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all")
  async getAll(): Promise<any> {
    return success(await this.crawlerService.findAll());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("config")
  getConfig(): Promise<any> {
    return success(this.crawlerService.getConfig());
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("setConfig")
  setConfig(@Request() req: any): Promise<any> {
    const maxDepth = req.body.maxDepth;
    const maxPages = req.body.maxPages;
    return success(this.crawlerService.setConfig(maxDepth, maxPages));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("crawl")
  async crawlWebsite(@Request() req: any): Promise<any> {
    const websites = JSON.parse(req.body.websites);
    const maxDepth = req.body.maxDepth;
    const maxPages = req.body.maxPages;
    const waitJS = req.body.waitJS;

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

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("tags")
  async crawlTags(@Request() req: any): Promise<any> {
    const tagsId = JSON.parse(req.body.tagsId);
    return success(await this.crawlerService.crawlTags(tagsId));
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("crawlUser")
  async crawlUserPage(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = req.body.website;
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

  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("crawlUserCheck")
  async checkCrawlUserPage(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = req.body.website;
    const websiteId = await this.crawlerService.getWebsiteId(
      userId,
      websiteUrl
    );

    return success(
      await this.crawlerService.isUserCrawlerDone(userId, websiteId)
    );
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("crawlUserResults")
  async getCrawlUserPageResults(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = req.body.website;
    const websiteId = await this.crawlerService.getWebsiteId(
      userId,
      websiteUrl
    );

    return success(
      await this.crawlerService.getUserCrawlResults(userId, websiteId)
    );
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("crawlUserDelete")
  async deleteCrawlUserPage(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = req.body.website;
    const websiteId = await this.crawlerService.getWebsiteId(
      userId,
      websiteUrl
    );

    return success(
      await this.crawlerService.deleteUserCrawler(userId, websiteId)
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Post("crawlStudiesUser")
  async crawlStudiesUserPage(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = req.body.website;
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

  @UseGuards(AuthGuard("jwt-study"))
  @Post("crawlStudiesUserCheck")
  async checkStudiesCrawlUserPage(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const websiteUrl = req.body.website;
    const websiteId = await this.crawlerService.getWebsiteId(
      userId,
      websiteUrl
    );

    return success(
      await this.crawlerService.isUserCrawlerDone(userId, websiteId)
    );
  }

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

  @UseGuards(AuthGuard("jwt-study"))
  @Post("crawlStudiesUserResults")
  async getCrawlStudiesUserPageResults(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const websiteId = req.body.website;

    return success(
      await this.crawlerService.getUserCrawlResults(userId, websiteId)
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Post("crawlStudiesUserDelete")
  async deleteCrawlStudiesUserPage(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const websiteId = req.body.website;

    return success(
      await this.crawlerService.deleteUserCrawler(userId, websiteId)
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("delete")
  async deleteCrawl(@Request() req: any): Promise<any> {
    const crawlWebsiteId = req.body.crawlWebsiteId;

    return success(await this.crawlerService.delete(crawlWebsiteId));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("deleteBulk")
  async deleteCrawlers(@Request() req: any): Promise<any> {
    const crawlWebsiteIds = JSON.parse(req.body.crawlWebsiteIds);

    return success(await this.crawlerService.deleteBulk(crawlWebsiteIds));
  }

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
