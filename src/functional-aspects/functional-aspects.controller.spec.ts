import { Test, TestingModule } from "@nestjs/testing";
import { FunctionalAspectsController } from "./functional-aspects.controller";

describe("Functional Aspects Controller", () => {
  let controller: FunctionalAspectsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FunctionalAspectsController],
    }).compile();

    controller = module.get<FunctionalAspectsController>(FunctionalAspectsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
