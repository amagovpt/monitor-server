import { Controller, Get, HttpCode, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ObservatoryService } from './observatory.service';
import { ObservatoryDocs } from './observatory.swagger';
import { CacheableBy } from 'src/core/cache/decorator/cache-resource.decorator';

ObservatoryDocs.controller();
@Controller('observatory')
export class ObservatoryController {
  constructor(private readonly observatoryService: ObservatoryService) {}

  @ObservatoryDocs.getGlobalMetrics()
  @Get('')
  @CacheableBy({
    key: 'global_metrics_observatory',
    ttl: 60,
  })
  @HttpCode(200)
  async getGlobalMetrics(): Promise<any> {
    const data = await this.observatoryService.getGlobalMetrics();
    return data;
  }

  @ObservatoryDocs.getDirectoriesRanks()
  @Get('directories')
  @CacheableBy({
    key: 'directories_ranks_observatory',
    ttl: 60,
  })
  @HttpCode(200)
  async getDirectoriesRanks(): Promise<any> {
    const data = await this.observatoryService.getDirectoriesStatistics();
    return data;
  }

  @ObservatoryDocs.getDirectoryWebsites()
  @Get('directories/:id/websites')
  @CacheableBy({
    key: 'directory_websites_observatory',
    source: 'path',
    param: 'id',
    ttl: 60,
  })
  @HttpCode(200)
  async getDirectoryWebsites(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const data = await this.observatoryService.getDirectoryWebsites(id);
    return data;
  }

  @ObservatoryDocs.getDirectoryStatistics()
  @Get('directories/:id/statistics')
  @CacheableBy({
    key: 'directory_statistics_observatory',
    source: 'path',
    param: 'id',
    ttl: 60,
  })
  @HttpCode(200)
  async getDirectoryStatistics(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const data = await this.observatoryService.getDirectoryStatistics(id);
    return data;
  }

  @ObservatoryDocs.searchWebsites()
  @Get('websites/search')
  @HttpCode(200)
  async searchWebsites(@Query('query') query: string): Promise<any> {
    const data = await this.observatoryService.searchWebsites(query);
    return data;
  }

  @ObservatoryDocs.getWebsiteMetrics()
  @Get('websites/:id')
  @CacheableBy({
    key: 'website_metrics_observatory',
    source: 'path',
    param: 'id',
    ttl: 60,
  })
  @HttpCode(200)
  async getWebsiteMetrics(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const data = await this.observatoryService.getWebsiteMetrics(id);
    return data;
  }
}
