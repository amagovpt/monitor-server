import { Test, TestingModule } from '@nestjs/testing';
import { EntityController } from './entity.controller';

describe('Entity Controller', () => {
  let controller: EntityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntityController],
    }).compile();

    controller = module.get<EntityController>(EntityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
