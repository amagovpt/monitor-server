import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Connection, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Page } from './page.entity';
export declare class PageGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly authService;
    private readonly pageRepository;
    private readonly connection;
    server: Server;
    constructor(authService: AuthService, pageRepository: Repository<Page>, connection: Connection);
    handleConnection(): Promise<void>;
    handleDisconnect(): Promise<void>;
    handleMessage(data: string, client: Socket): Promise<boolean>;
}
