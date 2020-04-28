import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Connection, getManager } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import clone from 'lodash.clone';
import { Evaluation } from './evaluation.entity';
import { initEvaluator, executeUrlEvaluation } from './middleware';

@Injectable()
export class EvaluationService {

  private isEvaluatingInstance1: boolean;
  private isEvaluatingInstance2: boolean;
  private isEvaluatingInstance3: boolean;

  private isEvaluatingUserInstance4: boolean;
  private isEvaluatingUserInstance5: boolean;
  private isEvaluatingUserInstance6: boolean;

  constructor(
    private readonly connection: Connection
  ) {
    this.isEvaluatingInstance1 = false;
    this.isEvaluatingInstance2 = false;
    this.isEvaluatingInstance3 = false;
    this.isEvaluatingUserInstance4 = false;
    this.isEvaluatingUserInstance5 = false;
    this.isEvaluatingUserInstance6 = false;

    initEvaluator();
  }

  @Cron('* * * * *') // Called every minute
  async instance1EvaluatePageList(): Promise<void> {
    if (process.env.NAMESPACE !== 'AMP' && process.env.NODE_APP_INSTANCE === '0') {
      if (!this.isEvaluatingInstance1) {
        this.isEvaluatingInstance1 = true;

        const pages = await getManager().query(`SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId IS NULL AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 10`);
        await this.evaluateInBackground(pages);

        this.isEvaluatingInstance1 = false;
      }
    }
  }

  @Cron('*/5 * * * *') // Called every 5 minutes
  async instance2EvaluatePageListevaluatePageList(): Promise<void> {
    if (process.env.NAMESPACE !== 'AMP' && process.env.NODE_APP_INSTANCE === '1') {
      if (!this.isEvaluatingInstance2) {
        this.isEvaluatingInstance2 = true;

        const pages = await getManager().query(`SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId IS NULL AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 10`);
        await this.evaluateInBackground(pages);

        this.isEvaluatingInstance2 = false;
      }
    }
  }

  @Cron('*/10 * * * *') // Called every 10 minutes
  async instance3EvaluatePageListevaluatePageList(): Promise<void> {
    if (process.env.NAMESPACE !== 'AMP' && process.env.NODE_APP_INSTANCE === '2') {
      if (!this.isEvaluatingInstance3) {
        this.isEvaluatingInstance3 = true;

        const pages = await getManager().query(`SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId IS NULL AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 10`);
        await this.evaluateInBackground(pages);

        this.isEvaluatingInstance3 = false;
      }
    }
  }

  @Cron('* * * * *') // Called every minute
  async instance4EvaluateUserPageList(): Promise<void> {
    if (process.env.NAMESPACE !== 'AMP' && process.env.NODE_APP_INSTANCE === '3') {
      if (!this.isEvaluatingUserInstance4) {
        this.isEvaluatingUserInstance4 = true;

        const pages = await getManager().query(`SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId IS NOT NULL AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 10`);
        await this.evaluateInBackground(pages);

        this.isEvaluatingUserInstance4 = false;
      }
    }
  }

  @Cron('*/5 * * * *') // Called every 5 minutes
  async instance5EvaluateUserPageListevaluatePageList(): Promise<void> {
    if (process.env.NAMESPACE !== 'AMP' && process.env.NODE_APP_INSTANCE === '4') {
      if (!this.isEvaluatingUserInstance5) {
        this.isEvaluatingUserInstance5 = true;

        const pages = await getManager().query(`SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId IS NOT NULL AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 10`);
        await this.evaluateInBackground(pages);

        this.isEvaluatingUserInstance5 = false;
      }
    }
  }

  @Cron('*/10 * * * *') // Called every 10 minutes
  async instance6EvaluateUserPageListevaluatePageList(): Promise<void> {
    if (process.env.NAMESPACE !== 'AMP' && process.env.NODE_APP_INSTANCE === '5') {
      if (!this.isEvaluatingUserInstance6) {
        this.isEvaluatingUserInstance6 = true;

        const pages = await getManager().query(`SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId IS NOT NULL AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 10`);
        await this.evaluateInBackground(pages);

        this.isEvaluatingUserInstance6 = false;
      }
    }
  }

  /*@Cron('0 0 * * 0') // Called every minute
  async evaluateOldPages(): Promise<void> {
    if (process.env.NAMESPACE !== 'AMP' && process.env.NODE_APP_INSTANCE === '1') {

      const pagesToEvaluate = await getManager().query(`
        SELECT DISTINCT p.PageId, p.Uri, e.Evaluation_Date
        FROM 
          Page as p, 
          Evaluation as e 
        WHERE
          e.PageId = p.PageId AND e.Evaluation_Date = (
            SELECT Evaluation_Date FROM Evaluation 
            WHERE PageId = p.PageId 
            ORDER BY Evaluation_Date DESC LIMIT 1
          )  
        ORDER BY e.Evaluation_Date ASC LIMIT 100
      `);
      
      for (const pte of pagesToEvaluate || []) {
        let error = null;
        let evaluation: any;
        try {
          evaluation = clone(await this.evaluateUrl(pte.Url));
        } catch (e) {
          error = e.stack;
        }

        const queryRunner = this.connection.createQueryRunner();

        await queryRunner.connect();
        
        await queryRunner.startTransaction();

        try {
          if (!error && evaluation) {
            this.savePageEvaluation(queryRunner, pte.PageId, evaluation, '10');
          }

          await queryRunner.commitTransaction();
        } catch (err) {
          // since we have errors lets rollback the changes we made
          await queryRunner.rollbackTransaction();
          console.log(err);
        } finally {
          await queryRunner.release();
        }
      }
    }
  }*/

  private async evaluateInBackground(pages: any[]): Promise<void> {
    if (pages) {
      await getManager().query(`UPDATE Evaluation_List SET Is_Evaluating = 1 WHERE EvaluationListId IN (?)`, [pages.map(p => p.EvaluationListId)]);

      for (const pte of pages || []) {
        let error = null;
        let evaluation: any;
        try {
          evaluation = clone(await this.evaluateUrl(pte.Url));
        } catch (e) {
          error = e.stack;
        }

        const queryRunner = this.connection.createQueryRunner();

        await queryRunner.connect();
        
        await queryRunner.startTransaction();

        try {
          if (!error && evaluation) {
            this.savePageEvaluation(queryRunner, pte.PageId, evaluation, pte.Show_To);

            await queryRunner.manager.query(`DELETE FROM Evaluation_List WHERE EvaluationListId = ?`, [pte.EvaluationListId]);
          } else {
            await queryRunner.manager.query(`UPDATE Evaluation_List SET Error = "?", Is_Evaluating = 0 WHERE EvaluationListId = ?`,[error.toString(), pte.EvaluationListId]);
          }

          await queryRunner.commitTransaction();
        } catch (err) {
          // since we have errors lets rollback the changes we made
          await queryRunner.rollbackTransaction();
          console.log(err);
        } finally {
          await queryRunner.release();
        }
      }
    }
  }

  evaluateUrl(url: string): Promise<any> {
    return executeUrlEvaluation(url);
  }

  async createOne(evaluation: Evaluation): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.save(evaluation);

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async evaluatePageAndSave(pageId: number, url: string, showTo: string): Promise<any> {
    const evaluation = await this.evaluateUrl(url);

    const newEvaluation = new Evaluation();
    newEvaluation.PageId = pageId;
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
    newEvaluation.Show_To = showTo;

    const saveSuccess = await this.createOne(newEvaluation);

    if (saveSuccess) {
      return evaluation;
    } else {
      throw new InternalServerErrorException();
    }
  }

  async savePageEvaluation(queryRunner: any, pageId: number, evaluation: any, showTo: string): Promise<any> {
    const newEvaluation = new Evaluation();
    newEvaluation.PageId = pageId;
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
    newEvaluation.Show_To = showTo;

    await queryRunner.manager.save(newEvaluation);
  }

  async findMyMonitorUserWebsitePageNewestEvaluation(userId: number, website: string, url: string): Promise<any> {
    
    const manager = getManager();

    const evaluation = (await manager.query(`SELECT e.* 
      FROM
        Website as w,
        Domain as d,
        DomainPage as dp,
        Page as p,
        Evaluation as e
      WHERE
        w.Name = ? AND
        w.UserId = ? AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        p.Uri = ? AND 
        e.PageId = p.PageId AND 
        e.Show_To LIKE '_1'
      ORDER BY e.Evaluation_Date DESC 
      LIMIT 1`, [website, userId, url]))[0];

    if (evaluation) {
      const tot = JSON.parse(Buffer.from(evaluation.Tot, 'base64').toString());
      return {
        pagecode: Buffer.from(evaluation.Pagecode, 'base64').toString(),
        data: {
          title: evaluation.Title,
          score: evaluation.Score,
          rawUrl: url,
          tot: tot,
          nodes: JSON.parse(Buffer.from(evaluation.Nodes, 'base64').toString()),
          conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
          elems: tot.elems,
          date: evaluation.Evaluation_Date
        }
      };
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findStudyMonitorUserTagWebsitePageNewestEvaluation(userId: number, tag: string, website: string, url: string): Promise<any> {
    const manager = getManager();

    const evaluation = (await manager.query(`SELECT e.* 
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d,
        DomainPage as dp,
        Page as p,
        Evaluation as e
      WHERE
        LOWER(t.Name) = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        LOWER(w.Name) = ? AND
        w.UserId = ? AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        LOWER(p.Uri) = ? AND 
        e.PageId = p.PageId
      ORDER BY e.Evaluation_Date DESC 
      LIMIT 1`, [tag.toLowerCase(), userId, website.toLowerCase(), userId, url.toLowerCase()]))[0];

    if (evaluation) {
      const tot = JSON.parse(Buffer.from(evaluation.Tot, 'base64').toString());
      return {
        pagecode: Buffer.from(evaluation.Pagecode, 'base64').toString(),
        data: {
          title: evaluation.Title,
          score: evaluation.Score,
          rawUrl: url,
          tot: tot,
          nodes: JSON.parse(Buffer.from(evaluation.Nodes, 'base64').toString()),
          conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
          elems: tot.elems,
          date: evaluation.Evaluation_Date
        }
      };
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findAllEvaluationsFromPage(type: string, page: string): Promise<any> {
    const manager = getManager();
    let query = '';

    if (type === 'admin') {
      query = `SELECT distinct e.EvaluationId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date
        FROM
          User as u,
          Website as w,
          Domain as d,
          DomainPage as dp,
          Page as p,
          Evaluation as e
        WHERE
          LOWER(p.Uri) = ? AND
          p.Show_In LIKE "1%%" AND
          e.PageId = p.PageId AND
          e.Show_To LIKE "1_" AND
          dp.PageId = p.PageId AND
          d.DomainId = dp.DomainId AND
          w.WebsiteId = d.WebsiteId AND
          w.Deleted = "0" AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) = "monitor"))
        ORDER BY e.Evaluation_Date DESC`;
    } else if (type === 'monitor') {
      query = `SELECT distinct e.EvaluationId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date
        FROM
          User as u,
          Website as w,
          Domain as d,
          DomainPage as dp,
          Page as p,
          Evaluation as e
        WHERE
          LOWER(p.Uri) = ? AND
          p.Show_In LIKE "11%" AND
          e.PageId = p.PageId AND
          e.Show_To LIKE "_1" AND
          dp.PageId = p.PageId AND
          d.DomainId = dp.DomainId AND
          w.WebsiteId = d.WebsiteId AND
          u.UserId = w.UserId AND 
          LOWER(u.Type) = "monitor"
        ORDER BY e.Evaluation_Date DESC`;
    } else if (type === 'studies') {
      query = `SELECT distinct e.EvaluationId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date
        FROM
          Page as p,
          Evaluation as e
        WHERE
          LOWER(p.Uri) = ? AND
          e.PageId = p.PageId
        ORDER BY e.Evaluation_Date DESC
        LIMIT 1`;
    } else {
      throw new InternalServerErrorException();
    }

    const evaluations = await manager.query(query, [page.toLowerCase()]);
    return evaluations;
  }

  async findEvaluationById(url: string, id: number): Promise<any> {
    const manager = getManager();

    const evaluation = await manager.findOne(Evaluation, { where: { EvaluationId: id } });

    const tot = JSON.parse(Buffer.from(evaluation.Tot, 'base64').toString());

    return {
      pagecode: Buffer.from(evaluation.Pagecode, 'base64').toString(),
      data: {
        title: evaluation.Title,
        score: evaluation.Score,
        rawUrl: url,
        tot: tot,
        nodes: JSON.parse(Buffer.from(evaluation.Nodes, 'base64').toString()),
        conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
        elems: tot.elems,
        date: evaluation.Evaluation_Date
      }
    };
  }

  async findUserPageEvaluation(url: string, type: string): Promise<any> {
    let query = null;
    if (type === 'monitor') {
      query = `SELECT e.* FROM Page as p, Evaluation as e WHERE p.Uri LIKE ? AND e.PageId = p.PageId AND e.Show_To LIKE "_1" ORDER BY e.Evaluation_Date DESC LIMIT 1`;
    } else if (type === 'studies') {
      query = `SELECT e.* FROM Page as p, Evaluation as e WHERE p.Uri LIKE ? AND e.PageId = p.PageId ORDER BY e.Evaluation_Date DESC LIMIT 1`;
    } else {
      throw new InternalServerErrorException();
    }

    const manager = getManager();

    const evaluation = (await manager.query(query, [url]))[0]

    const tot = JSON.parse(Buffer.from(evaluation.Tot, 'base64').toString());

    return {
      pagecode: Buffer.from(evaluation.Pagecode, 'base64').toString(),
      data: {
        title: evaluation.Title,
        score: evaluation.Score,
        rawUrl: url,
        tot: tot,
        nodes: JSON.parse(Buffer.from(evaluation.Nodes, 'base64').toString()),
        conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
        elems: tot.elems,
        date: evaluation.Evaluation_Date
      }
    };
  }
}