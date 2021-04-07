import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
//import { NestCrawlerModule } from 'nest-crawler';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { CrawlDomain, CrawlPage } from './crawler.entity';
import { PageModule } from 'src/page/page.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CrawlDomain, CrawlPage]),
    //NestCrawlerModule
    PageModule
  ],
  controllers: [CrawlerController],
  providers: [CrawlerService],
  exports: [CrawlerService]
})
export class CrawlerModule {}
