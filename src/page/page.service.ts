import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, getManager, Like } from 'typeorm';
import { Website } from '../website/website.entity';
import { Page } from './page.entity';
import { Evaluation } from '../evaluation/evaluation.entity';
import { EvaluationService } from 'src/evaluation/evaluation.service';

@Injectable()
export class PageService {

  constructor(
    @InjectRepository(Website)
    private readonly websiteRepository: Repository<Website>,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    private readonly connection: Connection,
    private readonly evaluationService: EvaluationService
  ) {}

  async findAll(): Promise<any> {
    const manager = getManager();
    const pages = await manager.query(`SELECT p.*, e.Score, e.Evaluation_Date 
      FROM 
        Page as p
        LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Evaluation_Date = (
          SELECT Evaluation_Date FROM Evaluation 
          WHERE PageId = p.PageId
          ORDER BY Evaluation_Date DESC LIMIT 1
        ) 
      WHERE
        LOWER(p.Show_In) LIKE '1%'
      GROUP BY p.PageId, e.Score, e.Evaluation_Date`);
    return pages;
  }

  getObservatoryData(): Promise<any> {
    const manager = getManager();
    return manager.query(`
      SELECT
        e.EvaluationId,
        e.Title,
        e.Score,
        e.Errors,
        e.Tot,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date,
        p.PageId,
        p.Uri,
        p.Creation_Date as Page_Creation_Date,
        d.Url,
        w.WebsiteId,
        w.Name as Website_Name,
        w.Creation_Date as Website_Creation_Date,
        en.Long_Name as Entity_Name,
        t.TagId,
        t.Name as Tag_Name,
        t.Show_in_Observatorio,
        t.Creation_Date as Tag_Creation_Date
      FROM
        Evaluation as e,
        Page as p,
        DomainPage as dp,
        Domain as d,
        Website as w
        LEFT OUTER JOIN Entity as en ON en.EntityId = w.EntityId,
        TagWebsite as tw,
        Tag as t
      WHERE
        t.Show_in_Observatorio = 1 AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        d.WebsiteId = w.WebsiteId AND
        d.Active = 1 AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        p.Show_In LIKE '%1' AND
        e.PageId = p.PageId AND e.Evaluation_Date = (
          SELECT Evaluation_Date FROM Evaluation 
          WHERE PageId = p.PageId AND Show_To LIKE "1_" 
          ORDER BY Evaluation_Date DESC LIMIT 1
        )
    `);
  }

  async findAllFromMyMonitorUserWebsite(userId: number, websiteName: string): Promise<any> {
    const website = await this.websiteRepository.findOne({ where: { UserId: userId, Name: websiteName } });
    if (!website) {
      throw new InternalServerErrorException();
    }

    const manager = getManager();
    
    const pages = await manager.query(`SELECT 
      distinct p.*,
      e.Score,
      e.A,
      e.AA,
      e.AAA,
      e.Errors,
      e.Evaluation_Date
    FROM 
      Page as p,
      Website as w,
      Domain as d,
      DomainPage as dp,
      Evaluation as e
    WHERE
      w.Name = ? AND
      w.UserId = ? AND
      d.WebsiteId = w.WebsiteId AND
      dp.DomainId = d.DomainId AND
      p.PageId = dp.PageId AND
      e.PageId = p.PageId AND
      p.Show_In LIKE '_1_' AND
      e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId)`, [website.Name, website.UserId]);
    
    return pages;
  }

  async createMyMonitorUserWebsitePages(userId: number, website: string, domain: string, uris: string[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const uri of uris || []) {
        const page = await queryRunner.manager.findOne(Page, { where: { Uri: decodeURIComponent(uri) }});
        
        if (page) {
          const showIn = page.Show_In[0] + '1' + page.Show_In[2];
          await queryRunner.manager.update(Page, { PageId: page.PageId }, { Show_In: showIn });
          await queryRunner.manager.update(Evaluation, { PageId: page.PageId, Show_To: Like('1_') }, { Show_To: '11' });
        } else {
          const evaluation = <any> await this.evaluationService.evaluateUrl(uri);
          
          const newPage = new Page();
          newPage.Uri = uri;
          newPage.Show_In = '010';
          newPage.Creation_Date = new Date();

          const insertPage = await queryRunner.manager.save(newPage);

          const webpage = Buffer.from(evaluation.pagecode).toString('base64');
          const data = evaluation.data;

          data.title = data.title.replace(/"/g, '');

          const conform = data.conform.split('@');
          const tot = Buffer.from(JSON.stringify(data.tot)).toString('base64');
          const nodes = Buffer.from(JSON.stringify(data.nodes)).toString('base64');
          const elems = Buffer.from(JSON.stringify(data.elems)).toString('base64');

          const newEvaluation = new Evaluation();
          newEvaluation.PageId = insertPage.PageId;
          newEvaluation.Title = data.title;
          newEvaluation.Score = data.score;
          newEvaluation.Pagecode = webpage;
          newEvaluation.Tot = tot;
          newEvaluation.Nodes = nodes;
          newEvaluation.Errors = elems;
          newEvaluation.A = conform[0];
          newEvaluation.AA = conform[1];
          newEvaluation.AAA = conform[2];
          newEvaluation.Evaluation_Date = data.date;
          newEvaluation.Show_To = '01';

          await queryRunner.manager.save(newEvaluation);

          await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) 
            SELECT 
              d.DomainId, 
              ?
            FROM
              Website as w,
              Domain as d
            WHERE 
              w.Name = ? AND
              w.UserId = ? AND
              d.WebsiteId = w.WebsiteId AND
              d.Url = ? AND
              d.Active = 1`, [insertPage.PageId, website, userId, domain]);
        }
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

    //return !hasError;
    return await this.findAllFromMyMonitorUserWebsite(userId, website);
  }

  async removeMyMonitorUserWebsitePages(userId: number, website: string, pagesIds: number[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const pageId of pagesIds || []) {
        const page = await this.pageRepository.findOne({ select: ['Show_In'], where: { PageId: pageId } });
        if (page) {
          const showIn = page.Show_In[0] + '0' + page.Show_In[2];
          await queryRunner.manager.update(Page, { PageId: pageId }, { Show_In: showIn });
          await queryRunner.manager.update(Evaluation, { PageId: pageId, Show_To: Like('11') }, { Show_To: '10' });
        }
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

    //return !hasError;
    return await this.findAllFromMyMonitorUserWebsite(userId, website);
  }
}
