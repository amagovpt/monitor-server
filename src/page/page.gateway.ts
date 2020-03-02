import { WebSocketServer, ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import * as SqlString from 'sqlstring';
import { AuthService } from '../auth/auth.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { Page } from './page.entity';
import { Evaluation } from '../evaluation/evaluation.entity';

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
    console.log('Connect');
  }

  async handleDisconnect(){
    console.log('Disconnect');
  }

  @SubscribeMessage('page')
  async handleMessage(@MessageBody() data: string, @ConnectedSocket() client: Socket): Promise<boolean> {
    if (/*this.authService.verifyJWT(data['token'])*/ true) {
      let hasError = false;
      const uri = decodeURIComponent(data['uri']);
      const domainId = SqlString.escape(data['domainId']);
      const observatory = SqlString.escape(data['observatory']);

      const queryRunner = this.connection.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const page = await this.pageRepository.findOne({ select: ['PageId', 'Show_In'], where: { Uri: uri }});

        if (page) {
          let newShowIn = '100';
          if (observatory) {
            if (page.Show_In[1] === '1') {
              newShowIn = '111';
            } else {
              newShowIn = '101';
            }
          } else {
            if (page.Show_In[1] === '1') {
              newShowIn = '110';
            }
          }

          await queryRunner.manager.update(Page, { PageId: page.PageId }, { Show_In: newShowIn });
        } else {
          let showIn = null;

          if (observatory) {
            showIn = '101'
          } else {
            showIn = '100';
          }

          const evaluation = await this.evaluationService.evaluateUrl(uri);

          const newPage = new Page();
          newPage.Uri = uri;
          newPage.Show_In = showIn;
          newPage.Creation_Date = new Date();

          const insertPage = await queryRunner.manager.save(newPage);
          await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`, [domainId, insertPage.PageId]);

          const newEvaluation = new Evaluation();
          newEvaluation.PageId = insertPage.PageId;
          newEvaluation.Title = evaluation.data.title.replace(/"/g, '');
          newEvaluation.Score = evaluation.data.score;
          newEvaluation.Pagecode = Buffer.from(evaluation.pagecode).toString('base64');
          newEvaluation.Tot = Buffer.from(JSON.stringify(evaluation.data.tot)).toString('base64');
          newEvaluation.Nodes = Buffer.from(JSON.stringify(evaluation.data.nodes)).toString('base64');
          newEvaluation.Errors = Buffer.from(JSON.stringify(evaluation.data.elems)).toString('base64');
          
          const conform = evaluation.data.conform.split('@');
          
          newEvaluation.A = conform[0];
          newEvaluation.AA = conform[1];
          newEvaluation.AAA = conform[2];
          newEvaluation.Evaluation_Date = evaluation.data.date;
          newEvaluation.Show_To = '10';

          await queryRunner.manager.save(newEvaluation);
        }

        await queryRunner.commitTransaction();
      } catch (err) {
        // since we have errors lets rollback the changes we made
        await queryRunner.rollbackTransaction();
        hasError = true;
        console.log(err);
      } finally {
        // you need to release a queryRunner which was manually instantiated
        await queryRunner.release();
      }

      return !hasError;
    } else {
      return false;
    }
  }
}
