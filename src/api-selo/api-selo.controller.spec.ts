import { Test, TestingModule } from "@nestjs/testing";
import { APISeloController } from "./api-selo.controller";

describe("ApiseloController", () => {
  let controller: APISeloController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [APISeloController],
    }).compile();

    controller = module.get<APISeloController>(APISeloController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
