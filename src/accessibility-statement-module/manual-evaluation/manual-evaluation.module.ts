import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManualEvaluation } from './entities/manual-evaluation.entity';
import { ManualEvaluationService } from './manual-evaluation.service';

@Module({
  imports: [TypeOrmModule.forFeature([ManualEvaluation])],
  providers: [ManualEvaluationService],
  exports: [ManualEvaluationService]
})
export class ManualEvaluationModule {}
