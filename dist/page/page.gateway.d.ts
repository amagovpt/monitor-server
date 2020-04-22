import { Server, Socket } from 'socket.io';
import { EvaluationService } from '../evaluation/evaluation.service';
export declare class PageGateway {
    private readonly evaluationService;
    server: Server;
    constructor(evaluationService: EvaluationService);
    evaluateUrl(data: any, client: Socket): Promise<any>;
}
