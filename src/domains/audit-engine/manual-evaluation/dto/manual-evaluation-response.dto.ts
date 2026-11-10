import { ApiProperty } from "@nestjs/swagger";
import { EvaluationAspect, RawEvaluationResult } from "../manual-evaluation.entity";

export class ManualEvaluationResponseDTO {
  @ApiProperty({ example: 1, description: "Unique identifier of the manual evaluation" })
  id: number;

  @ApiProperty({ example: 42, description: "Identifier of the evaluated website" })
  websiteId: number;

  @ApiProperty({ enum: EvaluationAspect, description: "Evaluation aspect type" })
  aspect: EvaluationAspect;

  @ApiProperty({ example: "2025-01-15T10:30:00.000Z", description: "Date the evaluation was performed" })
  evaluationDate: Date;

  @ApiProperty({ example: 87.5, description: "Compliance score (0-100)" })
  complianceScore: number;

  @ApiProperty({ type: "object", additionalProperties: true, description: "Raw evaluation results keyed by test group" })
  rawResult: RawEvaluationResult;

  @ApiProperty({ example: "2025-01-15T10:30:00.000Z", description: "Creation timestamp" })
  createdAt: Date;

  @ApiProperty({ example: "2025-01-15T10:30:00.000Z", description: "Last update timestamp" })
  updatedAt: Date;
}
