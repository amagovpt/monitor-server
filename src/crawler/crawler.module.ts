import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CrawlerController } from "./crawler.controller";
import { CrawlerService } from "./crawler.service";
import { CrawlWebsite, CrawlPage } from "./crawler.entity";
import { PageModule } from "src/page/page.module";

@Module({
  imports: [TypeOrmModule.forFeature([CrawlWebsite, CrawlPage]), PageModule],
  controllers: [CrawlerController],
  providers: [CrawlerService],
  exports: [CrawlerService],
})
export class CrawlerModule {}
