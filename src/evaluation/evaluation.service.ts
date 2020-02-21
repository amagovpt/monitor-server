import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, getManager } from 'typeorm';
import { Evaluation } from './evaluation.entity';
import { executeUrlEvaluation } from './middleware';

@Injectable()
export class EvaluationService {

  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluationRepository: Repository<Evaluation>,
    private readonly connection: Connection
  ) {}

  evaluateUrl(url: string): Promise<any> {
    return executeUrlEvaluation(url);
  }

  async createOne(evaluation: Evaluation): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.save(evaluation);

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }
}
