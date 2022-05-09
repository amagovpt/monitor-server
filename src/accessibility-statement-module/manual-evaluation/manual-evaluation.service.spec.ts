import { Test, TestingModule } from '@nestjs/testing';
import { ManualEvaluationService } from './manual-evaluation.service';

describe('ManualEvaluationService', () => {
  let service: ManualEvaluationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManualEvaluationService],
    }).compile();

    service = module.get<ManualEvaluationService>(ManualEvaluationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
