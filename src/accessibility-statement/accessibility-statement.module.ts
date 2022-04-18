import { Module } from '@nestjs/common';
import { AccessibilityStatementService } from './accessibility-statement.service';
import { AccessibilityStatementController } from './accessibility-statement.controller';

@Module({
  controllers: [AccessibilityStatementController],
  providers: [AccessibilityStatementService]
})
export class AccessibilityStatementModule {}
