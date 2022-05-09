import { Module } from '@nestjs/common';
import { ManualEvaluationService } from './manual-evaluation.service';
import { ManualEvaluationController } from './manual-evaluation.controller';

@Module({
  controllers: [ManualEvaluationController],
  providers: [ManualEvaluationService]
})
export class ManualEvaluationModule {}
