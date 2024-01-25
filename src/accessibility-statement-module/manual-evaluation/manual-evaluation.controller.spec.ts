import { Test, TestingModule } from '@nestjs/testing';
import { ManualEvaluationController } from './manual-evaluation.controller';
import { ManualEvaluationService } from './manual-evaluation.service';

describe('ManualEvaluationController', () => {
  let controller: ManualEvaluationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManualEvaluationController],
      providers: [ManualEvaluationService],
    }).compile();

    controller = module.get<ManualEvaluationController>(ManualEvaluationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
