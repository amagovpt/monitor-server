import { Module } from '@nestjs/common';
import { UserEvaluationService } from './user-evaluation.service';
import { UserEvaluationController } from './user-evaluation.controller';

@Module({
  controllers: [UserEvaluationController],
  providers: [UserEvaluationService]
})
export class UserEvaluationModule {}
