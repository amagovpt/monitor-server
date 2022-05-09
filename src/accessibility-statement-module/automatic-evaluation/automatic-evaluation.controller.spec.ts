import { Test, TestingModule } from '@nestjs/testing';
import { AutomaticEvaluationController } from './automatic-evaluation.controller';
import { AutomaticEvaluationService } from './automatic-evaluation.service';

describe('AutomaticEvaluationController', () => {
  let controller: AutomaticEvaluationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutomaticEvaluationController],
      providers: [AutomaticEvaluationService],
    }).compile();

    controller = module.get<AutomaticEvaluationController>(AutomaticEvaluationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
