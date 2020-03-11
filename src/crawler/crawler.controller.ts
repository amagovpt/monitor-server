import { Controller, Param, Request, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CrawlerService } from './crawler.service';
import { success } from '../lib/response';

@Controller('crawler')
export class CrawlerController {

  constructor(private readonly crawlerService: CrawlerService) { }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('all')
  async getAll(): Promise<any> {
    return success(await this.crawlerService.findAll());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('config')
  getConfig(): Promise<any> {
    return success(this.crawlerService.getConfig());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Post('setConfig')
  setConfig(@Request() req: any): Promise<any> {
    const maxDepth = req.body.maxDepth;
    const maxPages = req.body.maxPages;
    return success(this.crawlerService.setConfig(maxDepth, maxPages));
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('isSubDomainDone/:subDomain')
  async isSubDomainDone(@Param('subDomain') subDomain: string): Promise<any> {
    subDomain = decodeURIComponent(subDomain);
    return success(await this.crawlerService.isCrawlSubDomainDone(subDomain));
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Post('crawl')
  async crawlPage(@Request() req: any): Promise<any> {
    const domain = req.body.domain;
    const domainId = req.body.domainId;
    const subDomain = req.body.subDomain;
    const maxDepth = req.body.max_depth;
    const maxPages = req.body.max_pages;

    return success(await this.crawlerService.crawlDomain(subDomain, domain, domainId, maxDepth, maxPages));
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Post('delete')
  async deleteCrawl(@Request() req: any): Promise<any> {
    const crawlDomainId = req.body.crawlDomainId;

    return success(await this.crawlerService.delete(crawlDomainId));
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('getByCrawlDomainID/:crawlDomainId')
  async getCrawlResultsCrawlDomainID(@Param('crawlDomainId') crawlDomainId: string): Promise<any> {
    return success(await this.crawlerService.getCrawlResultsCrawlDomainID(parseInt(crawlDomainId)));
  }
}
