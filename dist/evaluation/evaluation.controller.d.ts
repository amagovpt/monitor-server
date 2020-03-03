import { EvaluationService } from './evaluation.service';
export declare class EvaluationController {
    private readonly evaluationService;
    constructor(evaluationService: EvaluationService);
    getMyMonitorWebsitePageEvaluation(req: any, website: string, url: string): Promise<any>;
    evaluateMyMonitorWebsitePage(req: any): Promise<any>;
}
