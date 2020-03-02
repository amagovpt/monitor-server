import { Connection, Repository } from 'typeorm';
import { Evaluation } from './evaluation.entity';
export declare class EvaluationService {
    private readonly evaluationRepository;
    private readonly connection;
    constructor(evaluationRepository: Repository<Evaluation>, connection: Connection);
    evaluateUrl(url: string): Promise<any>;
    createOne(evaluation: Evaluation): Promise<any>;
    findMyMonitorUserWebsitePageNewestEvaluation(userId: number, website: string, url: string): Promise<any>;
}
