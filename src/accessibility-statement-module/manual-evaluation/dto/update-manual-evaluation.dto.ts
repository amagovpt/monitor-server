import { PartialType } from "@nestjs/mapped-types";
import { CreateManualEvaluationDto } from "./create-manual-evaluation.dto";

export class UpdateManualEvaluationDto extends PartialType(
  CreateManualEvaluationDto
) {}
