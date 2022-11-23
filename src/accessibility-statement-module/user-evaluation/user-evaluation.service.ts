import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessibilityStatement } from '../accessibility-statement/entities/accessibility-statement.entity';
import { CreateUserEvaluationDto } from './dto/create-user-evaluation.dto';
import { UserEvaluation } from './entities/user-evaluation.entity';

@Injectable()
export class UserEvaluationService {
  constructor(
    @InjectRepository(UserEvaluation)
    private readonly userEvaluationRepository: Repository<UserEvaluation>) { }
  create(createUserEvaluationDto: CreateUserEvaluationDto, accessibilityStatement: AccessibilityStatement) {
    const evaluation = this.userEvaluationRepository.create({
      ...createUserEvaluationDto, accessibilityStatement
    });
    return this.userEvaluationRepository.save(evaluation);
  }

  async getLength() {
    return (await this.userEvaluationRepository.query(`SELECT COUNT(*) as length FROM User_Evaluation`))[0].length;
  }
}
