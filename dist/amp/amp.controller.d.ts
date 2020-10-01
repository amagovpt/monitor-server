import { EvaluationService } from '../evaluation/evaluation.service';
export declare class AmpController {
    private readonly evaluationService;
    constructor(evaluationService: EvaluationService);
    evaluateUrl(url: string): Promise<any>;
    evaluateHtml(req: any): Promise<any>;
    private checkIfValidUrl;
    private fixUrl;
}
