import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Connection, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { Page } from './page.entity';
export declare class PageGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly authService;
    private readonly evaluationService;
    private readonly pageRepository;
    private readonly connection;
    server: Server;
    constructor(authService: AuthService, evaluationService: EvaluationService, pageRepository: Repository<Page>, connection: Connection);
    handleConnection(): Promise<void>;
    handleDisconnect(): Promise<void>;
    addPages(data: any, client: Socket): Promise<any>;
    reEvaluateWebsite(data: any, client: Socket): Promise<any>;
    reEvaluateEntity(data: any, client: Socket): Promise<any>;
    reEvaluateTag(data: any, client: Socket): Promise<any>;
}
