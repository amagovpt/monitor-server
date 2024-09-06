import { PartialType } from "@nestjs/mapped-types";
import { CreateAccessibilityStatementDto } from "./create-accessibility-statement.dto";

export class UpdateAccessibilityStatementDto extends PartialType(
  CreateAccessibilityStatementDto
) {}
