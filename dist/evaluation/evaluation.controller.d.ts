import { EvaluationService } from './evaluation.service';
export declare class EvaluationController {
    private readonly evaluationService;
    constructor(evaluationService: EvaluationService);
    removeMyMonitorUserWebsitePages(req: any, website: string, url: string): Promise<any>;
}
