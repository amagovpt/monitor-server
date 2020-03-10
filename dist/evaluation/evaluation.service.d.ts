import { Connection, Repository } from 'typeorm';
import { Evaluation } from './evaluation.entity';
import { Page } from '../page/page.entity';
export declare class EvaluationService {
    private readonly pageRepository;
    private readonly evaluationRepository;
    private readonly connection;
    constructor(pageRepository: Repository<Page>, evaluationRepository: Repository<Evaluation>, connection: Connection);
    findPageFromUrl(url: string): Promise<any>;
    isPageFromMyMonitorUser(userId: number, pageId: number): Promise<any>;
    isPageFromStudyMonitorUser(userId: number, tag: string, website: string, pageId: number): Promise<any>;
    evaluateUrl(url: string): Promise<any>;
    createOne(evaluation: Evaluation): Promise<any>;
    evaluatePageAndSave(pageId: number, url: string, showTo: string): Promise<any>;
    savePageEvaluation(queryRunner: any, pageId: number, evaluation: any, showTo: string): Promise<any>;
    findMyMonitorUserWebsitePageNewestEvaluation(userId: number, website: string, url: string): Promise<any>;
    findStudyMonitorUserTagWebsitePageNewestEvaluation(userId: number, tag: string, website: string, url: string): Promise<any>;
    findAllEvaluationsFromPage(type: string, page: string): Promise<any>;
    findEvaluationById(url: string, id: number): Promise<any>;
    findUserPageEvaluation(url: string, type: string): Promise<any>;
}
