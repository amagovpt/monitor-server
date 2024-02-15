import { Test, TestingModule } from '@nestjs/testing';
import { ApiSeloService } from './api-selo.service';

describe('ApiSeloService', () => {
  let service: ApiSeloService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiSeloService],
    }).compile();

    service = module.get<ApiSeloService>(ApiSeloService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
