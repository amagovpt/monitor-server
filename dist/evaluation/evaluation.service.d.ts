import { Connection, Repository } from 'typeorm';
import { Evaluation } from './evaluation.entity';
import { Page } from '../page/page.entity';
export declare class EvaluationService {
    private readonly pageRepository;
    private readonly evaluationRepository;
    private readonly connection;
    constructor(pageRepository: Repository<Page>, evaluationRepository: Repository<Evaluation>, connection: Connection);
    findPageFromUrl(url: string): Promise<any>;
    isPageFromUser(userId: number, pageId: number): Promise<any>;
    evaluateUrl(url: string): Promise<any>;
    createOne(evaluation: Evaluation): Promise<any>;
    evaluatePageAndSave(pageId: number, url: string, showTo: string): Promise<any>;
    findMyMonitorUserWebsitePageNewestEvaluation(userId: number, website: string, url: string): Promise<any>;
}
