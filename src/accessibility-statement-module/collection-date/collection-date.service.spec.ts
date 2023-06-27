import { Test, TestingModule } from '@nestjs/testing';
import { CollectionDateService } from './collection-date.service';

describe('CollectionDateService', () => {
  let service: CollectionDateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CollectionDateService],
    }).compile();

    service = module.get<CollectionDateService>(CollectionDateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
