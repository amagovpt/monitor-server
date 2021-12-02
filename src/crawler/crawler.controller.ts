import {
  Controller,
  Param,
  Request,
  Get,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CrawlerService } from "./crawler.service";
import { success } from "../lib/response";

@Controller("crawler")
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
  @Get("isSubDomainDone/:subDomain")
  async isSubDomainDone(@Param("subDomain") subDomain: string): Promise<any> {
    subDomain = decodeURIComponent(subDomain);
    return success(await this.crawlerService.isCrawlSubDomainDone(subDomain));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("crawl")
  async crawlPage(@Request() req: any): Promise<any> {
    const websites = JSON.parse(req.body.websites);
    const maxDepth = req.body.maxDepth;
    const maxPages = req.body.maxPages;
    const waitJS = req.body.waitJS;

    return success(
      await this.crawlerService.crawlDomain(
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
    const domain = req.body.domain;
    const domainId = await this.crawlerService.getDomainId(userId, domain);

    return success(
      await this.crawlerService.crawlDomain(
        userId,
        [{ url: domain, domainId }],
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
    const domain = req.body.domain;
    const domainId = await this.crawlerService.getDomainId(userId, domain);

    return success(
      await this.crawlerService.isUserCrawlerDone(userId, domainId)
    );
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("crawlUserResults")
  async getCrawlUserPageResults(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const domain = req.body.domain;
    const domainId = await this.crawlerService.getDomainId(userId, domain);

    return success(
      await this.crawlerService.getUserCrawlResults(userId, domainId)
    );
  }

  @UseGuards(AuthGuard("jwt-monitor"))
  @Post("crawlUserDelete")
  async deleteCrawlUserPage(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const domain = req.body.domain;
    const domainId = await this.crawlerService.getDomainId(userId, domain);

    return success(
      await this.crawlerService.deleteUserCrawler(userId, domainId)
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Post("crawlStudiesUser")
  async crawlStudiesUserPage(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const domain = req.body.domain;
    const domainId = await this.crawlerService.getDomainId(userId, domain);

    return success(
      await this.crawlerService.crawlDomain(
        userId,
        [{ url: domain, domainId }],
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
    const domain = req.body.domain;
    const domainId = await this.crawlerService.getDomainId(userId, domain);

    return success(
      await this.crawlerService.isUserCrawlerDone(userId, domainId)
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
    const domainId = req.body.domain;

    return success(
      await this.crawlerService.getUserCrawlResults(userId, domainId)
    );
  }

  @UseGuards(AuthGuard("jwt-study"))
  @Post("crawlStudiesUserDelete")
  async deleteCrawlStudiesUserPage(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const domainId = req.body.domain;

    return success(
      await this.crawlerService.deleteUserCrawler(userId, domainId)
    );
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("delete")
  async deleteCrawl(@Request() req: any): Promise<any> {
    const crawlDomainId = req.body.crawlDomainId;

    return success(await this.crawlerService.delete(crawlDomainId));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("deleteBulk")
  async deleteCrawlers(@Request() req: any): Promise<any> {
    const crawlDomainIds = JSON.parse(req.body.crawlDomainIds);

    return success(await this.crawlerService.deleteBulk(crawlDomainIds));
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Get("getByCrawlDomainID/:crawlDomainId")
  async getCrawlResultsCrawlDomainID(
    @Param("crawlDomainId") crawlDomainId: string
  ): Promise<any> {
    return success(
      await this.crawlerService.getCrawlResultsCrawlDomainID(
        parseInt(crawlDomainId)
      )
    );
  }
}
