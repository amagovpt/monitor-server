import { Module } from '@nestjs/common';
import { AmpController } from './amp.controller';
import { EvaluationModule } from '../evaluation/evaluation.module';

@Module({
  imports: [EvaluationModule],
  controllers: [AmpController]
})
export class AmpModule {}
