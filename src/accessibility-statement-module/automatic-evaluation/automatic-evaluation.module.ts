import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomaticEvaluationService } from './automatic-evaluation.service';
import { AutomaticEvaluation } from './entities/automatic-evaluation.entity';

@Module({
  imports:[ TypeOrmModule.forFeature([AutomaticEvaluation])],
  providers: [AutomaticEvaluationService],
  exports: [AutomaticEvaluationService]
})
export class AutomaticEvaluationModule {}
