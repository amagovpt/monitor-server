import { WebSocketServer, ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EvaluationService } from '../evaluation/evaluation.service';

@WebSocketGateway()
export class PageGateway {

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly evaluationService: EvaluationService
  ) {}

  @SubscribeMessage('evaluation')
  async evaluateUrl(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<any> {

    const url =  decodeURIComponent(data.url);

    const evaluation = await this.evaluationService.evaluateUrl(url);

    client.emit('result', evaluation);
  }
}
