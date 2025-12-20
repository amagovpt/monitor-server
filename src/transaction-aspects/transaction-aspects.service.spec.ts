import { Test, TestingModule } from "@nestjs/testing";
import { TransactionAspectsService } from "./transaction-aspects.service";

describe("TransactionAspectsService", () => {
  let service: TransactionAspectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionAspectsService],
    }).compile();

    service = module.get<TransactionAspectsService>(TransactionAspectsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
