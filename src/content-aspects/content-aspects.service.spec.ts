import { Test, TestingModule } from "@nestjs/testing";
import { ContentAspectsService } from "./content-aspects.service";

describe("ContentAspectsService", () => {
  let service: ContentAspectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentAspectsService],
    }).compile();

    service = module.get<ContentAspectsService>(ContentAspectsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
