import { Module } from '@nestjs/common';
import { AccessibilityStatementService } from './accessibility-statement.service';
import { AccessibilityStatementController } from './accessibility-statement.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessibilityStatement } from './entities/accessibility-statement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessibilityStatement])],
  controllers: [AccessibilityStatementController],
  providers: [AccessibilityStatementService],
  exports:[AccessibilityStatementService]
})
export class AccessibilityStatementModule { }
