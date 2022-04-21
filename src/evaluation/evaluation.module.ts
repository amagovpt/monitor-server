import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationService } from './evaluation.service';
import { Evaluation } from './evaluation.entity';
import { EvaluationController } from './evaluation.controller';

import { Page } from '../page/page.entity';
import { AccessibilityStatementModule } from 'src/accessibility-statement/accessibility-statement.module';

@Module({
  imports: [TypeOrmModule.forFeature([Page, Evaluation]), AccessibilityStatementModule],
  exports: [EvaluationService],
  providers: [EvaluationService],
  controllers: [EvaluationController]
})
export class EvaluationModule {}
