import { Test, TestingModule } from '@nestjs/testing';
import { ObservatoryController } from './observatory.controller';

describe('Observatory Controller', () => {
  let controller: ObservatoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObservatoryController],
    }).compile();

    controller = module.get<ObservatoryController>(ObservatoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
