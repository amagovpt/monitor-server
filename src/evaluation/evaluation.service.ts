import { Injectable } from '@nestjs/common';
import { Evaluation } from './evaluation.entity';
import { executeUrlEvaluation } from './middleware';

@Injectable()
export class EvaluationService {

  evaluateUrl(url: string): Promise<any> {
    return executeUrlEvaluation(url);
  }

  createOne(evaluation: Evaluation): Promise<any> {
    return null;
  }
}
