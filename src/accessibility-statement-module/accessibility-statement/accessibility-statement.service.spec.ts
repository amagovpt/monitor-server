import { Test, TestingModule } from '@nestjs/testing';
import { AccessibilityStatementService } from './accessibility-statement.service';

describe('AccessibilityStatementService', () => {
  let service: AccessibilityStatementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccessibilityStatementService],
    }).compile();

    service = module.get<AccessibilityStatementService>(AccessibilityStatementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
