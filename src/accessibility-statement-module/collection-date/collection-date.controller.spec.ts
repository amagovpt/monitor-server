import { Test, TestingModule } from '@nestjs/testing';
import { CollectionDateController } from './collection-date.controller';
import { CollectionDateService } from './collection-date.service';

describe('CollectionDateController', () => {
  let controller: CollectionDateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollectionDateController],
      providers: [CollectionDateService],
    }).compile();

    controller = module.get<CollectionDateController>(CollectionDateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
