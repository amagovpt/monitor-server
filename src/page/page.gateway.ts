import { WebSocketServer, ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import * as SqlString from 'sqlstring';
import { AuthService } from '../auth/auth.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { Page } from './page.entity';
import { Evaluation } from '../evaluation/evaluation.entity';
import { UnauthorizedException } from '@nestjs/common';

@WebSocketGateway()
export class PageGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly evaluationService: EvaluationService,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    private readonly connection: Connection
  ) {}

  async handleConnection(){
    
  }

  async handleDisconnect(){
    
  }

  @SubscribeMessage('evaluation')
  async evaluateUrl(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<any> {

    const url =  decodeURIComponent(data.url);

    const evaluation = await this.evaluationService.evaluateUrl(url);

    client.emit('result', evaluation);
  }
}
