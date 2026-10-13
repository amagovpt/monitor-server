import { Module, Provider } from '@nestjs/common';
import { RepositoryTableConfig } from 'src/common/repositories/base-context';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerPageModule } from '../crawler-page/crawler-page.module';
import { CrawlerWebsiteController } from './crawler-website.controller';
import { CrawlerWebsite } from './entities/crawler-website.entity';
import { CrawlerWebsiteRepository } from './crawler-website.repository';
import { CrawlerWebsiteService } from './crawler-website.service';
import { CrawlPrivateWorker } from './processors/crawler-private.processor';
import { WebsitesGateway } from './gateways/crawler.gateway';
import { WebsiteModule } from 'src/domains/inventory/website/website.module';
import { IWebsiteScraper } from './types/scraper.interface';
import { CrawlPublicWorker } from './processors/crawler-public.processor';
import { CrawlWebsiteHandler } from './handlers/crawl-websites.handler';
import { CRAWLER_WEBSITE_CONTEXT_METADATA_CONFIG } from './crawler-website.constants';
import { QueuesModule } from 'src/core/queues/queues.module';
import { PlaywrightWebsiteScraperAdapter } from './strategies/playwright-website-scraper.adapter';
export const CrawlerWebsiteTableConfigProvider: Provider = {
  provide: CRAWLER_WEBSITE_CONTEXT_METADATA_CONFIG,
  useFactory: (): RepositoryTableConfig => ({
    mainTable: {
      table: 'crawler_websites',
      alias: 'cw',
      pk: 'id',
      fk: 'website_id',
    },
    contextTable: {
      table: 'crawler_websites_contexts',
      alias: 'cwc',
      pk: 'id',
      fk: 'crawler_id',
    },

    hasHelperTable: false,
  }),
};
@Module({
  imports: [
    TypeOrmModule.forFeature([CrawlerWebsite]),
    QueuesModule,
    WebsiteModule,
    CrawlerPageModule,
  ],
  controllers: [CrawlerWebsiteController],
  providers: [
    CrawlerWebsiteService,
    CrawlerWebsiteRepository,
    CrawlPublicWorker,
    CrawlPrivateWorker,
    WebsitesGateway,

    {
      provide: IWebsiteScraper,
      useClass: PlaywrightWebsiteScraperAdapter,
    },
    CrawlWebsiteHandler,
    CrawlerWebsiteTableConfigProvider,
  ],
  exports: [CrawlerWebsiteService, CrawlerWebsiteRepository],
})
export class CrawlerWebsiteModule {}
