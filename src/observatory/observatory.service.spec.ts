import { Test, TestingModule } from '@nestjs/testing';
import { ObservatoryService } from './observatory.service';

describe('ObservatoryService', () => {
  let service: ObservatoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ObservatoryService],
    }).compile();

    service = module.get<ObservatoryService>(ObservatoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
