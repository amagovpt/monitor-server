import { Module } from '@nestjs/common';
import { AccessibilityStatementService } from './accessibility-statement.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessibilityStatement } from './entities/accessibility-statement.entity';
import { AutomaticEvaluationModule } from '../automatic-evaluation/automatic-evaluation.module';
import { ManualEvaluationModule } from '../manual-evaluation/manual-evaluation.module';
import { UserEvaluationModule } from '../user-evaluation/user-evaluation.module';
import { ContactModule } from '../contact/contact.module';
import { AccessibilityStatementController } from './accessibility-statement.controller';

@Module({
  controllers: [AccessibilityStatementController],
  imports: [
    TypeOrmModule.forFeature([AccessibilityStatement]), AutomaticEvaluationModule, ManualEvaluationModule, UserEvaluationModule, ContactModule],
  providers: [AccessibilityStatementService],
  exports: [AccessibilityStatementService]
})
export class AccessibilityStatementModule { }
