import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessibilityStatement } from '../accessibility-statement/entities/accessibility-statement.entity';
import { CreateManualEvaluationDto } from './dto/create-manual-evaluation.dto';
import { ManualEvaluation } from './entities/manual-evaluation.entity';

@Injectable()
export class ManualEvaluationService {
  constructor(
    @InjectRepository(ManualEvaluation)
    private readonly manualEvaluationRepository: Repository<ManualEvaluation>) { }
  create(createManualEvaluationDto: CreateManualEvaluationDto, accessibilityStatement: AccessibilityStatement) {
    const evaluation = this.manualEvaluationRepository.create({
      ...createManualEvaluationDto, accessibilityStatement
    });
    return this.manualEvaluationRepository.save(evaluation);
  }
}
