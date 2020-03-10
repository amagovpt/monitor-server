import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { CrawlDomain, CrawlPage } from './crawler.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CrawlDomain, CrawlPage])],
  controllers: [CrawlerController],
  providers: [CrawlerService],
  exports: [CrawlerService]
})
export class CrawlerModule {}
