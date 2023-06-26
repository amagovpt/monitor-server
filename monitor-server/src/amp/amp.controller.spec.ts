import { Test, TestingModule } from '@nestjs/testing';
import { AmpController } from './amp.controller';

describe('Amp Controller', () => {
  let controller: AmpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AmpController],
    }).compile();

    controller = module.get<AmpController>(AmpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
