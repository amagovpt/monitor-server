import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistsController } from './checklists.controller';

describe('Criteria Controller', () => {
  let controller: ChecklistsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChecklistsController],
    }).compile();

    controller = module.get<ChecklistsController>(ChecklistsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
