import { Test, TestingModule } from "@nestjs/testing";
import { FunctionalAspectsService } from "./functional-aspects.service";

describe("FunctionalAspectsService", () => {
  let service: FunctionalAspectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FunctionalAspectsService],
    }).compile();

    service = module.get<FunctionalAspectsService>(FunctionalAspectsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
