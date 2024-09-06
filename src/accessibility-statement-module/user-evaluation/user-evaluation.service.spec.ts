import { Test, TestingModule } from "@nestjs/testing";
import { UserEvaluationService } from "./user-evaluation.service";

describe("UserEvaluationService", () => {
  let service: UserEvaluationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserEvaluationService],
    }).compile();

    service = module.get<UserEvaluationService>(UserEvaluationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
