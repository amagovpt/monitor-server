import { Connection } from "typeorm";
import { Evaluation } from "./evaluation.entity";
export declare class EvaluationService {
    private readonly connection;
    private isEvaluatingAdminInstance;
    private isEvaluatingUserInstance;
    constructor(connection: Connection);
    instanceEvaluateAdminPageList(): Promise<void>;
    private evaluateInBackground;
    evaluateUrl(url: string): Promise<any>;
    evaluateHtml(html: string): Promise<any>;
    createOne(evaluation: Evaluation): Promise<any>;
    evaluatePageAndSave(pageId: number, url: string, showTo: string): Promise<any>;
    savePageEvaluation(queryRunner: any, pageId: number, evaluation: any, showTo: string, studyUserId?: number | null): Promise<any>;
    findMyMonitorUserWebsitePageEvaluations(userId: number, website: string): Promise<any>;
    findMyMonitorUserWebsitePageNewestEvaluation(userId: number, website: string, url: string): Promise<any>;
    findStudyMonitorUserTagWebsitePageEvaluations(userId: number, tag: string, website: string): Promise<any>;
    findStudyMonitorUserTagWebsitePageNewestEvaluation(userId: number, tag: string, website: string, url: string): Promise<any>;
    findAllEvaluationsFromPage(type: string, page: string): Promise<any>;
    findEvaluationById(url: string, id: number): Promise<any>;
    findUserPageEvaluation(url: string, type: string): Promise<any>;
    tryAgainEvaluation(evaluationListId: number): Promise<boolean>;
    findDomainEvaluations(domain: string, sample: boolean): Promise<any>;
}
