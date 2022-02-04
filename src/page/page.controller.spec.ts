import { Test, TestingModule } from '@nestjs/testing';
import { PageController } from './page.controller';

// @ts-ignore
describe('Page Controller', () => {
  let controller: PageController;

  // @ts-ignore
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PageController],
    }).compile();

    controller = module.get<PageController>(PageController);
  });

  // @ts-ignore
  it('should be defined', () => {
    // @ts-ignore
    expect(controller).toBeDefined();
  });
});
