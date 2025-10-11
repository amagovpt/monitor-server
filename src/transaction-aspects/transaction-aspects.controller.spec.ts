import { Test, TestingModule } from "@nestjs/testing";
import { TransactionAspectsController } from "./transaction-aspects.controller";

describe("Transaction Aspects Controller", () => {
  let controller: TransactionAspectsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionAspectsController],
    }).compile();

    controller = module.get<TransactionAspectsController>(TransactionAspectsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
