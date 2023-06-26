import { Test, TestingModule } from '@nestjs/testing';
import { DumpController } from './dump.controller';
import { DumpService } from './dump.service';

describe('DumpController', () => {
  let controller: DumpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DumpController],
      providers: [DumpService],
    }).compile();

    controller = module.get<DumpController>(DumpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
