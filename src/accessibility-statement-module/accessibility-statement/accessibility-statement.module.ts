import { Module } from '@nestjs/common';
import { AccessibilityStatementService } from './accessibility-statement.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessibilityStatement } from './entities/accessibility-statement.entity';
import { AutomaticEvaluationService } from '../automatic-evaluation/automatic-evaluation.service';
import { ManualEvaluationService } from '../manual-evaluation/manual-evaluation.service';
import { UserEvaluationService } from '../user-evaluation/user-evaluation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessibilityStatement]),AutomaticEvaluationService,ManualEvaluationService,UserEvaluationService],
  providers: [AccessibilityStatementService],
  exports:[AccessibilityStatementService]
})
export class AccessibilityStatementModule { }
