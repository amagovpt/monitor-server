import { Test, TestingModule } from '@nestjs/testing';
import { CriticalAspectsController } from './critical-aspects.controller';

describe('Criteria Controller', () => {
  let controller: CriticalAspectsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CriticalAspectsController],
    }).compile();

    controller = module.get<CriticalAspectsController>(CriticalAspectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
