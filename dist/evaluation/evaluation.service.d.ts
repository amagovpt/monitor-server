import { Evaluation } from './evaluation.entity';
export declare class EvaluationService {
    evaluateUrl(url: string): Promise<any>;
    createOne(evaluation: Evaluation): Promise<any>;
}
