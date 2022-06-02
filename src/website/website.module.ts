import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WebsiteService } from "./website.service";
import { Website } from "./website.entity";
import { Tag } from "../tag/tag.entity";
import { Page } from "../page/page.entity";
import { WebsiteController } from "./website.controller";
import { EvaluationModule } from "../evaluation/evaluation.module";
import { AccessibilityStatementModule } from "src/accessibility-statement-module/accessibility-statement/accessibility-statement.module";

@Module({
  imports: [TypeOrmModule.forFeature([Tag, Website, Page]), EvaluationModule,
    AccessibilityStatementModule],
  exports: [WebsiteService],
  providers: [WebsiteService],
  controllers: [WebsiteController],
})
export class WebsiteModule { }
