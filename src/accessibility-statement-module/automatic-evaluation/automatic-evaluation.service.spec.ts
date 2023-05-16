import { Test, TestingModule } from '@nestjs/testing';
import { AutomaticEvaluationService } from './automatic-evaluation.service';

describe('AutomaticEvaluationService', () => {
  let service: AutomaticEvaluationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AutomaticEvaluationService],
    }).compile();

    service = module.get<AutomaticEvaluationService>(AutomaticEvaluationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
