import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageService } from './page.service';
import { Page } from './page.entity';
import { PageController } from './page.controller';
import { AuthModule } from '../auth/auth.module';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { Website } from '../website/website.entity';
import { Evaluation } from '../evaluation/evaluation.entity';
import { PageGateway } from './page.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Website, Page, Evaluation]), AuthModule, EvaluationModule],
  exports: [PageService],
  providers: [PageService, PageGateway],
  controllers: [PageController]
})
export class PageModule {}
