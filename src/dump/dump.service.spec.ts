import { Test, TestingModule } from '@nestjs/testing';
import { DumpService } from './dump.service';

describe('DumpService', () => {
  let service: DumpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DumpService],
    }).compile();

    service = module.get<DumpService>(DumpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
