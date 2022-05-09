import { Module } from '@nestjs/common';
import { AutomaticEvaluationService } from './automatic-evaluation.service';
import { AutomaticEvaluationController } from './automatic-evaluation.controller';

@Module({
  controllers: [AutomaticEvaluationController],
  providers: [AutomaticEvaluationService]
})
export class AutomaticEvaluationModule {}
