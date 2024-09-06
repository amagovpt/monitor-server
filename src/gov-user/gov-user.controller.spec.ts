import { Test, TestingModule } from "@nestjs/testing";
import { GovUserController } from "./gov-user.controller";
import { GovUserService } from "./gov-user.service";

describe("GovUserController", () => {
  let controller: GovUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GovUserController],
      providers: [GovUserService],
    }).compile();

    controller = module.get<GovUserController>(GovUserController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
