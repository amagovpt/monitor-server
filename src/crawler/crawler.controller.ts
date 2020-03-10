import { Controller, Param, Request, Get, UseGuards } from '@nestjs/common';
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
}
