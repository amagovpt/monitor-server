import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationService } from './evaluation.service';
import { Evaluation } from './evaluation.entity';
import { EvaluationController } from './evaluation.controller';

import { Page } from '../page/page.entity';
import { UsabilityModule } from 'src/usability/usability.module';

@Module({
  imports: [TypeOrmModule.forFeature([Page, Evaluation]), UsabilityModule],
  exports: [EvaluationService],
  providers: [EvaluationService],
  controllers: [EvaluationController]
})
export class EvaluationModule {}
