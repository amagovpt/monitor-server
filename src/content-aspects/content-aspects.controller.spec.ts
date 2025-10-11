import { Test, TestingModule } from "@nestjs/testing";
import { ContentAspectsController } from "./content-aspects.controller";

describe("Content Aspects Controller", () => {
  let controller: ContentAspectsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentAspectsController],
    }).compile();

    controller = module.get<ContentAspectsController>(ContentAspectsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
