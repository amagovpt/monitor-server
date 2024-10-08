import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AccessibilityStatement } from "../accessibility-statement/entities/accessibility-statement.entity";
import { CreateManualEvaluationDto } from "./dto/create-manual-evaluation.dto";
import { ManualEvaluation } from "./entities/manual-evaluation.entity";

@Injectable()
export class ManualEvaluationService {
  constructor(
    @InjectRepository(ManualEvaluation)
    private readonly manualEvaluationRepository: Repository<ManualEvaluation>
  ) {}
  create(
    createManualEvaluationDto: CreateManualEvaluationDto,
    accessibilityStatement: AccessibilityStatement
  ) {
    let heuristics = {};
    if (createManualEvaluationDto.Heuristics) {
      const heuristicsValue = createManualEvaluationDto.Heuristics;
      const splittedText = heuristicsValue.split("/");
      const HeuristicsPassed = parseInt(splittedText[0]);
      const HeuristicsTotal = parseInt(splittedText[1]);
      heuristics = { HeuristicsPassed, HeuristicsTotal };
    }
    const evaluation = this.manualEvaluationRepository.create({
      ...createManualEvaluationDto,
      accessibilityStatement,
      ...heuristics,
    });
    return this.manualEvaluationRepository.save(evaluation);
  }

  async getLength() {
    return (
      await this.manualEvaluationRepository.query(
        `SELECT COUNT(*) as length FROM Manual_Evaluation`
      )
    )[0].length;
  }
}
