import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationService } from './evaluation.service';
import { Evaluation } from './evaluation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Evaluation])],
  exports: [EvaluationService],
  providers: [EvaluationService]
})
export class EvaluationModule {}
