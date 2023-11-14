import { Test, TestingModule } from '@nestjs/testing';
import { AccessibilityStatementController } from './accessibility-statement.controller';
import { AccessibilityStatementService } from './accessibility-statement.service';

describe('AccessibilityStatementController', () => {
  let controller: AccessibilityStatementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccessibilityStatementController],
      providers: [AccessibilityStatementService],
    }).compile();

    controller = module.get<AccessibilityStatementController>(AccessibilityStatementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
