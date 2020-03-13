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

  @SubscribeMessage('pages')
  async addPages(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<any> {
    const uris = JSON.parse(data.uris).map(uri => decodeURIComponent(uri));
    const observatory = JSON.parse(data.observatory).map(uri => decodeURIComponent(uri));;
    
    if (/*this.authService.verifyJWT(data['token'])*/ true) {
      for (const uri of uris || []) {
        let hasError = false;
        const domainId = SqlString.escape(data['domainId']);

        const queryRunner = this.connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          const page = await this.pageRepository.findOne({ select: ['PageId', 'Show_In'], where: { Uri: uri }});

          if (page) {
            let newShowIn = '100';
            if (observatory.indexOf(uri) > -1) {
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

            if (observatory.indexOf(uri) > -1) {
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
        const resultData = {
          success: !hasError,
          uri: encodeURIComponent(uri)
        };

        client.emit('evaluated', resultData);
      }

      return true;
    } else {
      throw new UnauthorizedException();
    }
  }

  @SubscribeMessage('website')
  async reEvaluateWebsite(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<any> {
    let cancel = false;

    client.on('cancel', data => {
      cancel = true;
    });

    const pages = await this.pageRepository.query(`
      SELECT 
        p.PageId, 
        p.Uri 
      FROM 
        DomainPage as dp, 
        Page as p
      WHERE
        dp.DomainId = ? AND
        p.PageId = dp.PageId AND
        p.Show_In LIKE ?`, [data.domainId, data.option === 'all' ? '1__' : '1_1']);

    client.emit('startup', pages.length);

    for (const page of pages || []) {

      if (cancel) {
        break;
      }

      client.emit('currentUri', encodeURIComponent(page.Uri));

      let hasError = false;

      try {
        await this.evaluationService.evaluatePageAndSave(page.PageId, page.Uri, '10');
      } catch (err) {
        hasError = true;
        console.log(err);
      }
      const resultData = {
        success: !hasError,
        uri: encodeURIComponent(page.Uri)
      };

      client.emit('evaluated', resultData);
    }
  }

  @SubscribeMessage('entity')
  async reEvaluateEntity(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<any> {
    let cancel = false;
    let skip = false;

    client.on('cancel', data => {
      cancel = true;
    });

    client.on('skip', data => {
      skip = true;
    });

    const websites = await this.pageRepository.query(`
      SELECT
        w.Name,
        d.DomainId
      FROM
        Website as w,
        Domain as d
      WHERE
        w.EntityId = ? AND
        d.WebsiteId = w.WebsiteId AND
        d.Active = 1
    `, [data.entityId]);

    client.emit('startupEntity', websites.length);

    for (const website of websites || []) {

      if (cancel) {
        break;
      }

      const pages = await this.pageRepository.query(`
        SELECT 
          p.PageId, 
          p.Uri 
        FROM 
          DomainPage as dp, 
          Page as p
        WHERE
          dp.DomainId = ? AND
          p.PageId = dp.PageId AND
          p.Show_In LIKE ?`, [website.DomainId, data.option === 'all' ? '1__' : '1_1']);

      client.emit('startupWebsite', { n_uris: pages.length, current_website: website.Name });

      for (const page of pages || []) {

        if (cancel || skip) {
          skip = false;
          break;
        }
  
        client.emit('currentUri', encodeURIComponent(page.Uri));
  
        let hasError = false;
  
        try {
          await this.evaluationService.evaluatePageAndSave(page.PageId, page.Uri, '10');
        } catch (err) {
          hasError = true;
          console.log(err);
        }
        const resultData = {
          success: !hasError,
          uri: encodeURIComponent(page.Uri)
        };
  
        client.emit('evaluated', resultData);
      }

      client.emit('websiteFinished', website.Name);
    }
  }

  @SubscribeMessage('tag')
  async reEvaluateTag(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<any> {
    let cancel = false;
    let skip = false;

    client.on('cancel', data => {
      cancel = true;
    });

    client.on('skip', data => {
      skip = true;
    });

    const websites = await this.pageRepository.query(`
      SELECT
        w.Name,
        d.DomainId
      FROM
        TagWebsite as tw,
        Website as w,
        Domain as d
      WHERE
        tw.TagId = ? AND
        w.WebsiteId = tw.WebsiteId AND
        d.WebsiteId = w.WebsiteId AND
        d.Active = 1
    `, [data.tagId]);

    client.emit('startupTag', websites.length);

    for (const website of websites || []) {

      if (cancel) {
        break;
      }

      const pages = await this.pageRepository.query(`
        SELECT 
          p.PageId, 
          p.Uri 
        FROM 
          DomainPage as dp, 
          Page as p
        WHERE
          dp.DomainId = ? AND
          p.PageId = dp.PageId AND
          p.Show_In LIKE ?`, [website.DomainId, data.option === 'all' ? '1__' : '1_1']);

      client.emit('startupWebsite', { n_uris: pages.length, current_website: website.Name });

      for (const page of pages || []) {

        if (cancel || skip) {
          skip = false;
          break;
        }
  
        client.emit('currentUri', encodeURIComponent(page.Uri));
  
        let hasError = false;
  
        try {
          await this.evaluationService.evaluatePageAndSave(page.PageId, page.Uri, '10');
        } catch (err) {
          hasError = true;
          console.log(err);
        }
        const resultData = {
          success: !hasError,
          uri: encodeURIComponent(page.Uri)
        };
  
        client.emit('evaluated', resultData);
      }

      client.emit('websiteFinished', website.Name);
    }
  }
}