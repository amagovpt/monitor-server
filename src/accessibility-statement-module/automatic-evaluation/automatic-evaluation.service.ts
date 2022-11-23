import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessibilityStatement } from '../accessibility-statement/entities/accessibility-statement.entity';
import { CreateAutomaticEvaluationDto } from './dto/create-automatic-evaluation.dto';
import { AutomaticEvaluation } from './entities/automatic-evaluation.entity';

@Injectable()
export class AutomaticEvaluationService {
  constructor(
    @InjectRepository(AutomaticEvaluation)
    private readonly automaticEvaluationRepository: Repository<AutomaticEvaluation>) {
  }
  create(createAutomaticEvaluationDto: CreateAutomaticEvaluationDto, accessibilityStatement: AccessibilityStatement) {
    const evaluation = this.automaticEvaluationRepository.create({
      ...createAutomaticEvaluationDto, accessibilityStatement
    });
    return this.automaticEvaluationRepository.save(evaluation);
  }

  async getLength(){
    return await this.automaticEvaluationRepository.query(`SELECT COUNT(*) as length FROM Automatic_Evaluation`)[0].length;
  }

}
