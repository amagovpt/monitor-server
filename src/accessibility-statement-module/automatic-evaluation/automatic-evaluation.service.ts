import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessibilityStatement } from '../accessibility-statement/entities/accessibility-statement.entity';
import { CreateAutomaticEvaluationDto } from './dto/create-automatic-evaluation.dto';
import { UpdateAutomaticEvaluationDto } from './dto/update-automatic-evaluation.dto';
import { AutomaticEvaluation } from './entities/automatic-evaluation.entity';

@Injectable()
export class AutomaticEvaluationService {
  constructor(
    @InjectRepository(AccessibilityStatement)
    private readonly automaticEvaluationRepository: Repository<AutomaticEvaluation>){}
  create(createAutomaticEvaluationDto: CreateAutomaticEvaluationDto, accessibilityStatement: AccessibilityStatement) {
    const evaluation = this.automaticEvaluationRepository.create({
      ...createAutomaticEvaluationDto, accessibilityStatement
    });
    return this.automaticEvaluationRepository.save(evaluation);
  }

}
