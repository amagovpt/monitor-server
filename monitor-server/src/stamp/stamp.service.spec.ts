import { Test, TestingModule } from '@nestjs/testing';
import { StampService } from './stamp.service';

describe('StampService', () => {
  let service: StampService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StampService],
    }).compile();

    service = module.get<StampService>(StampService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
