import { PartialType } from '@nestjs/mapped-types';
import { CreateAutomaticEvaluationDto } from './create-automatic-evaluation.dto';

export class UpdateAutomaticEvaluationDto extends PartialType(CreateAutomaticEvaluationDto) {}
