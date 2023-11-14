import { Test, TestingModule } from '@nestjs/testing';
import { UserEvaluationController } from './user-evaluation.controller';
import { UserEvaluationService } from './user-evaluation.service';

describe('UserEvaluationController', () => {
  let controller: UserEvaluationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserEvaluationController],
      providers: [UserEvaluationService],
    }).compile();

    controller = module.get<UserEvaluationController>(UserEvaluationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
