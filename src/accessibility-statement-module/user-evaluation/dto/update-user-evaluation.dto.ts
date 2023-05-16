import { PartialType } from '@nestjs/mapped-types';
import { CreateUserEvaluationDto } from './create-user-evaluation.dto';

export class UpdateUserEvaluationDto extends PartialType(CreateUserEvaluationDto) {}
