import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Connection, getManager } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import clone from "lodash.clone";
import { Evaluation } from "./evaluation.entity";
import { executeUrlEvaluation, executeHtmlEvaluation } from "./middleware";

@Injectable()
export class EvaluationService {
  private isEvaluatingAdminInstance: boolean;
  private isEvaluatingUserInstance: boolean;

  constructor(private readonly connection: Connection) {
    this.isEvaluatingAdminInstance = false;
    this.isEvaluatingUserInstance = false;
  }

  @Cron(CronExpression.EVERY_5_SECONDS) // Called every minute - ADMIN EVALUATIONS
  async instanceEvaluateAdminPageList(): Promise<void> {
    if (process.env.NAMESPACE !== "AMP" && !this.isEvaluatingAdminInstance) {
      this.isEvaluatingAdminInstance = true;

      const skip =
        process.env.ID === undefined ? 0 : parseInt(process.env.ID) * 10;

      const pages = await getManager().query(
        `SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId = -1 AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 10, ${skip}`
      );
      await this.evaluateInBackground(pages);

      this.isEvaluatingAdminInstance = false;
    }
  }

  //@Cron(CronExpression.EVERY_5_SECONDS) // Called every minute - USERS EVALUATIONS
  /*async instanceEvaluateUserPageList(): Promise<void> {
    if (!this.isEvaluatingUserInstance) {
      this.isEvaluatingUserInstance = true;

      const pages = await getManager().query(
        `SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId <> -1 AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 1`
      );
      await this.evaluateInBackground(pages);

      this.isEvaluatingUserInstance = false;
    }
  }*/

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
    if (pages.length > 0) {
      try {
        await getManager().query(
          `UPDATE Evaluation_List SET Is_Evaluating = 1 WHERE EvaluationListId IN (?)`,
          [pages.map((p) => p.EvaluationListId)]
        );
      } catch (err) {
        console.error(err);
        throw err;
      }

      for (const pte of pages || []) {
        let error = null;
        let evaluation: any;
        try {
          evaluation = clone(await this.evaluateUrl(pte.Url));
        } catch (e) {
          //console.log(e);
          error = e.stack;
        }

        const queryRunner = this.connection.createQueryRunner();

        await queryRunner.connect();

        await queryRunner.startTransaction();

        try {
          if (!error && evaluation) {
            this.savePageEvaluation(
              queryRunner,
              pte.PageId,
              evaluation,
              pte.Show_To,
              pte.StudyUserId
            );

            await queryRunner.manager.query(
              `DELETE FROM Evaluation_List WHERE EvaluationListId = ?`,
              [pte.EvaluationListId]
            );
          } else {
            await queryRunner.manager.query(
              `UPDATE Evaluation_List SET Error = "?" , Is_Evaluating = 0 WHERE EvaluationListId = ?`,
              [error.toString(), pte.EvaluationListId]
            );
          }

          await queryRunner.commitTransaction();
        } catch (err) {
          // since we have errors lets rollback the changes we made
          await queryRunner.rollbackTransaction();
          console.error(err);
        } finally {
          await queryRunner.release();
        }
      }
    }
  }

  evaluateUrl(url: string): Promise<any> {
    return executeUrlEvaluation(url);
  }

  evaluateHtml(html: string): Promise<any> {
    return executeHtmlEvaluation(html);
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

  async evaluatePageAndSave(
    pageId: number,
    url: string,
    showTo: string
  ): Promise<any> {
    const evaluation = await this.evaluateUrl(url);

    const newEvaluation = new Evaluation();
    newEvaluation.PageId = pageId;
    newEvaluation.Title = evaluation.data.title.replace(/"/g, "");
    newEvaluation.Score = evaluation.data.score;
    newEvaluation.Pagecode = Buffer.from(evaluation.pagecode).toString(
      "base64"
    );
    newEvaluation.Tot = Buffer.from(
      JSON.stringify(evaluation.data.tot)
    ).toString("base64");
    newEvaluation.Nodes = Buffer.from(
      JSON.stringify(evaluation.data.nodes)
    ).toString("base64");
    newEvaluation.Errors = Buffer.from(
      JSON.stringify(evaluation.data.elems)
    ).toString("base64");

    const conform = evaluation.data.conform.split("@");

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

  async savePageEvaluation(
    queryRunner: any,
    pageId: number,
    evaluation: any,
    showTo: string,
    studyUserId: number | null = null
  ): Promise<any> {
    const newEvaluation = new Evaluation();
    newEvaluation.PageId = pageId;
    newEvaluation.Title = evaluation.data.title.replace(/"/g, "");
    newEvaluation.Score = evaluation.data.score;
    newEvaluation.Pagecode = Buffer.from(evaluation.pagecode).toString(
      "base64"
    );
    newEvaluation.Tot = Buffer.from(
      JSON.stringify(evaluation.data.tot)
    ).toString("base64");
    newEvaluation.Nodes = Buffer.from(
      JSON.stringify(evaluation.data.nodes)
    ).toString("base64");
    newEvaluation.Errors = Buffer.from(
      JSON.stringify(evaluation.data.elems)
    ).toString("base64");

    const conform = evaluation.data.conform.split("@");

    newEvaluation.A = conform[0];
    newEvaluation.AA = conform[1];
    newEvaluation.AAA = conform[2];
    newEvaluation.Evaluation_Date = evaluation.data.date;
    newEvaluation.Show_To = showTo;
    newEvaluation.StudyUserId = studyUserId;

    await queryRunner.manager.save(newEvaluation);
  }

  async findMyMonitorUserWebsitePageEvaluations(
    userId: number,
    website: string
  ): Promise<any> {
    const manager = getManager();

    const evaluations = await manager.query(
      `SELECT e.*, p.Uri 
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
        p.Show_In LIKE '_1_' AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId AND Show_To LIKE '_1')
      `,
      [website, userId]
    );

    const reports = new Array<any>();

    for (const evaluation of evaluations || []) {
      const tot = JSON.parse(Buffer.from(evaluation.Tot, "base64").toString());
      reports.push({
        pagecode: Buffer.from(evaluation.Pagecode, "base64").toString(),
        data: {
          title: evaluation.Title,
          score: evaluation.Score,
          rawUrl: evaluation.Uri,
          tot: tot,
          nodes: JSON.parse(Buffer.from(evaluation.Nodes, "base64").toString()),
          conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
          elems: tot.elems,
          date: evaluation.Evaluation_Date,
        },
      });
    }

    return reports;
  }

  async findMyMonitorUserWebsitePageNewestEvaluation(
    userId: number,
    website: string,
    url: string
  ): Promise<any> {
    const manager = getManager();

    const evaluation = (
      await manager.query(
        `SELECT e.* 
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
      LIMIT 1`,
        [website, userId, url]
      )
    )[0];

    if (evaluation) {
      const tot = JSON.parse(Buffer.from(evaluation.Tot, "base64").toString());
      return {
        pagecode: Buffer.from(evaluation.Pagecode, "base64").toString(),
        data: {
          title: evaluation.Title,
          score: evaluation.Score,
          rawUrl: url,
          tot: tot,
          nodes: JSON.parse(Buffer.from(evaluation.Nodes, "base64").toString()),
          conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
          elems: tot.elems,
          date: evaluation.Evaluation_Date,
        },
      };
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findStudyMonitorUserTagWebsitePageEvaluations(
    userId: number,
    tag: string,
    website: string
  ): Promise<any> {
    const manager = getManager();

    const evaluations = await manager.query(
      `SELECT e.*, p.Uri
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
        w.UserId = t.UserId AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId AND StudyUserId = w.UserId)
      `,
      [tag.toLowerCase(), userId, website.toLowerCase()]
    );

    const reports = new Array<any>();

    for (const evaluation of evaluations || []) {
      const tot = JSON.parse(Buffer.from(evaluation.Tot, "base64").toString());
      reports.push({
        pagecode: Buffer.from(evaluation.Pagecode, "base64").toString(),
        data: {
          title: evaluation.Title,
          score: evaluation.Score,
          rawUrl: evaluation.Uri,
          tot: tot,
          nodes: JSON.parse(Buffer.from(evaluation.Nodes, "base64").toString()),
          conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
          elems: tot.elems,
          date: evaluation.Evaluation_Date,
        },
      });
    }

    return reports;
  }

  async findStudyMonitorUserTagWebsitePageNewestEvaluation(
    userId: number,
    tag: string,
    website: string,
    url: string
  ): Promise<any> {
    const manager = getManager();

    const evaluation = (
      await manager.query(
        `SELECT e.* 
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
        e.PageId = p.PageId AND
        e.StudyUserId = ?
      ORDER BY e.Evaluation_Date DESC 
      LIMIT 1`,
        [
          tag.toLowerCase(),
          userId,
          website.toLowerCase(),
          userId,
          url.toLowerCase(),
          userId,
        ]
      )
    )[0];

    if (evaluation) {
      const tot = JSON.parse(Buffer.from(evaluation.Tot, "base64").toString());
      return {
        pagecode: Buffer.from(evaluation.Pagecode, "base64").toString(),
        data: {
          title: evaluation.Title,
          score: evaluation.Score,
          rawUrl: url,
          tot: tot,
          nodes: JSON.parse(Buffer.from(evaluation.Nodes, "base64").toString()),
          conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
          elems: tot.elems,
          date: evaluation.Evaluation_Date,
        },
      };
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findAllEvaluationsFromPage(type: string, page: string): Promise<any> {
    const manager = getManager();
    let query = "";

    if (type === "admin") {
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
    } else if (type === "monitor") {
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
    } else if (type === "studies") {
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

    const evaluation = await manager.findOne(Evaluation, {
      where: { EvaluationId: id },
    });

    const tot = JSON.parse(Buffer.from(evaluation.Tot, "base64").toString());

    return {
      pagecode: Buffer.from(evaluation.Pagecode, "base64").toString(),
      data: {
        title: evaluation.Title,
        score: evaluation.Score,
        rawUrl: url,
        tot: tot,
        nodes: JSON.parse(Buffer.from(evaluation.Nodes, "base64").toString()),
        conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
        elems: tot.elems,
        date: evaluation.Evaluation_Date,
      },
    };
  }

  async findUserPageEvaluation(url: string, type: string): Promise<any> {
    let query = null;
    if (type === "monitor") {
      query = `SELECT e.* FROM Page as p, Evaluation as e WHERE p.Uri LIKE ? AND e.PageId = p.PageId AND e.Show_To LIKE "_1" ORDER BY e.Evaluation_Date DESC LIMIT 1`;
    } else if (type === "studies") {
      query = `SELECT e.* FROM Page as p, Evaluation as e WHERE p.Uri LIKE ? AND e.PageId = p.PageId ORDER BY e.Evaluation_Date DESC LIMIT 1`;
    } else {
      throw new InternalServerErrorException();
    }

    const manager = getManager();

    const evaluation = (await manager.query(query, [url]))[0];

    const tot = JSON.parse(Buffer.from(evaluation.Tot, "base64").toString());

    return {
      pagecode: Buffer.from(evaluation.Pagecode, "base64").toString(),
      data: {
        title: evaluation.Title,
        score: evaluation.Score,
        rawUrl: url,
        tot: tot,
        nodes: JSON.parse(Buffer.from(evaluation.Nodes, "base64").toString()),
        conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
        elems: tot.elems,
        date: evaluation.Evaluation_Date,
      },
    };
  }

  async tryAgainEvaluation(evaluationListId: number): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.query(
        `UPDATE Evaluation_List SET Error = NULL, Is_Evaluating = 0 WHERE EvaluationListId = ?`,
        [evaluationListId]
      );

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

  async findDomainEvaluations(domain: string, sample: boolean): Promise<any> {
    const manager = getManager();

    const evaluations = await manager.query(
      `SELECT distinct e.*, p.Uri
      FROM
        Domain as d,
        DomainPage as dp,
        Page as p,
        Evaluation as e
      WHERE
        d.Url = ? AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        p.Show_In LIKE ? AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId AND Show_To LIKE '1_')
      `,
      [domain, sample ? "1__" : "1_1"]
    );

    const reports = new Array<any>();

    for (const evaluation of evaluations || []) {
      const tot = JSON.parse(Buffer.from(evaluation.Tot, "base64").toString());
      reports.push({
        pagecode: Buffer.from(evaluation.Pagecode, "base64").toString(),
        data: {
          title: evaluation.Title,
          score: evaluation.Score,
          rawUrl: evaluation.Uri,
          tot: tot,
          nodes: JSON.parse(Buffer.from(evaluation.Nodes, "base64").toString()),
          conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
          elems: tot.elems,
          date: evaluation.Evaluation_Date,
        },
      });
    }

    return reports;
  }
}
