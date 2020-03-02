import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationService } from './evaluation.service';
import { Evaluation } from './evaluation.entity';
import { EvaluationController } from './evaluation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Evaluation])],
  exports: [EvaluationService],
  providers: [EvaluationService],
  controllers: [EvaluationController]
})
export class EvaluationModule {}
