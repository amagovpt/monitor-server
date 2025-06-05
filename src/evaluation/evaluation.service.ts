import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import clone from "lodash.clone";
import fs from "fs";
import { Evaluation } from "./evaluation.entity";
import {
  executeUrlEvaluation,
  executeUrlsEvaluation,
  executeHtmlEvaluation,
} from "./middleware";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class EvaluationService {
  private isEvaluatingAdminInstance: boolean;
  private isEvaluatingUserInstance: boolean;
  private SKIP = 20;

  constructor(
    @InjectDataSource()
    private readonly connection: DataSource,
    @InjectRepository(Evaluation)
    private readonly evaluationRepository: Repository<Evaluation>
  ) {
    this.isEvaluatingAdminInstance = false;
    this.isEvaluatingUserInstance = false;
  }
  //FIXME confirmar se as paginas têm sempre avaliação
  async getLastEvaluationByPage(pageId: number): Promise<Evaluation> {
    const evaluationList = await this.evaluationRepository.find({
      where: { PageId: pageId },
      take: 1,
      order: { Evaluation_Date: "DESC" },
    });
    return evaluationList[0];
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  cleanUpErrorFiles(): void {
    fs.readdir("./", (err, files: string[]) => {
      if (!err) {
        for (const file of files ?? []) {
          if (file.startsWith("qualweb-errors")) {
            fs.unlink(file, (err2) => {
              if (err2) {
                console.error(err2);
              }
            });
          }
        }
      }
    });
  }

  @Cron(CronExpression.EVERY_5_SECONDS) // Called every 5 seconds - ADMIN EVALUATIONS
  async instanceEvaluateAdminPageList(): Promise<void> {
    if (
      (process.env.NAMESPACE === undefined ||
        process.env.NAMESPACE === "ADMIN") &&
      !this.isEvaluatingAdminInstance
    ) {
      this.isEvaluatingAdminInstance = true;

      let pages = [];
      if (
        process.env.NAMESPACE === undefined ||
        parseInt(process.env.AMSID) === 0
      ) {
        pages = await this.connection.query(
          `SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId = -1 AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 20`
        );
      } else {
        const skip = parseInt(process.env.AMSID) * this.SKIP;
        pages = await this.connection.query(
          `SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId = -1 AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 20, ${skip}`
        );
      }
      await this.evaluateInBackground(pages);

      this.isEvaluatingAdminInstance = false;
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS) // Called every 5 seconds - ADMIN EVALUATIONS
  async instanceEvaluateUserPageList(): Promise<void> {
    if (
      (process.env.NAMESPACE === undefined ||
        process.env.NAMESPACE === "USER") &&
      !this.isEvaluatingUserInstance
    ) {
      this.isEvaluatingUserInstance = true;

      let pages = [];
      if (
        process.env.NAMESPACE === undefined ||
        parseInt(process.env.USRID) === 0
      ) {
        pages = await this.connection.query(
          `SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId <> -1 AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 20`
        );
      } else {
        const skip = parseInt(process.env.USRID) * this.SKIP;
        pages = await this.connection.query(
          `SELECT * FROM Evaluation_List WHERE Error IS NULL AND UserId <> -1 AND Is_Evaluating = 0 ORDER BY Creation_Date ASC LIMIT 20, ${skip}`
        );
      }

      await this.evaluateInBackground(pages);

      this.isEvaluatingUserInstance = false;
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async evaluateStuckPages(): Promise<void> {
    const pages = await this.connection.query(
      `SELECT * FROM Evaluation_List WHERE Error IS NULL AND Is_Evaluating = 1 AND Creation_Date < DATE_SUB(NOW(), INTERVAL 2 HOUR)`
    );

    if (pages.length > 0) {
      try {
        await this.connection.query(
          `UPDATE Evaluation_List SET Is_Evaluating = 0 WHERE EvaluationListId IN (?)`,
          [pages.map((p) => p.EvaluationListId)]
        );
      } catch (err) {
        console.error(err);
        throw err;
      }
    }
  }

  /*@Cron('0 0 * * 0')
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
        await this.connection.query(
          `UPDATE Evaluation_List SET Is_Evaluating = 1 WHERE EvaluationListId IN (?)`,
          [pages.map((p) => p.EvaluationListId)]
        );
      } catch (err) {
        console.error(err);
        throw err;
      }

      let reports = {};

      try {
        reports = clone(await this.evaluateUrls(pages.map((p) => p.Url)));
      } catch (err) {
        console.error(err);
      }

      const queryRunner = this.connection.createQueryRunner();

      await queryRunner.connect();

      await queryRunner.startTransaction();

      for (const pte of pages ?? []) {
        if (reports[pte.Url]) {
          this.savePageEvaluation(
            queryRunner,
            pte.PageId,
            reports[pte.Url],
            pte.Show_To,
            pte.StudyUserId
          );

          await queryRunner.manager.query(
            `DELETE FROM Evaluation_List WHERE EvaluationListId = ?`,
            [pte.EvaluationListId]
          );
        } else {
          const error = this.findUrlError(pte.Url);
          await queryRunner.manager.query(
            `UPDATE Evaluation_List SET Error = "?" , Is_Evaluating = 0 WHERE EvaluationListId = ?`,
            [error, pte.EvaluationListId]
          );
        }
      }

      try {
        await queryRunner.commitTransaction();
      } catch (err) {
        // since we have errors lets rollback the changes we made
        await queryRunner.rollbackTransaction();
        console.error(err);
      } finally {
        await queryRunner.release();
      }

      /*for (const pte of pages || []) {
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
            console.log(error);
            await queryRunner.manager.query(
              `UPDATE Evaluation_List SET Error = "?" , Is_Evaluating = 0 WHERE EvaluationListId = ?`,
              [error?.toString() || error, pte.EvaluationListId]
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
      }*/
    }
  }

  private findUrlError(url: string): string {
    let error = "";
    const files = fs.readdirSync("./", { encoding: "utf-8" });
    for (const file of files ?? []) {
      if (file.startsWith("qualweb-errors") && !error) {
        const content = fs.readFileSync(file, { encoding: "utf-8" });
        if (content.includes(url)) {
          let split = content.split(url);
          split = split[1].split("-----------");
          split = split[0].split(":");
          error = split.splice(1).join(":").trim();
        }
      }
    }

    return error;
  }

  evaluateUrl(url: string): Promise<any> {
    return executeUrlEvaluation(url);
  }

  evaluateUrls(urls: string[]): Promise<any> {
    return executeUrlsEvaluation(urls);
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
    newEvaluation.Title = evaluation.data.title
      .replace(/"/g, "")
      .replace(/[\u0800-\uFFFF]/g, "");
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
    newEvaluation.Title = evaluation.data.title
      .replace(/"/g, "")
      .replace(/[\u0800-\uFFFF]/g, "");
    newEvaluation.Score = evaluation.data.score;
    newEvaluation.Pagecode = Buffer.from(evaluation.pagecode)
      .toString("base64")
      .substring(0, 16000000);
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
    newEvaluation.Element_Count = JSON.stringify(
      evaluation.data.tot.info.roles
    );
    newEvaluation.Tag_Count = JSON.stringify(evaluation.data.tot.info.cTags);
    const savedEvaluation = await queryRunner.manager.save(newEvaluation);
  }

  async postAMPExtensionEvaluation(pageId: number, data: string[]): Promise<any> {
    const splittedFirstLine = data[0].split(";");
    const splittedLastLine = data[data.length - 1].split(";");

    const newEvaluation = new Evaluation();
    newEvaluation.PageId = pageId;

    newEvaluation.Score = splittedFirstLine[9].replace(",", ".");
    newEvaluation.Pagecode = splittedLastLine[1];
    newEvaluation.Tot = splittedLastLine[2];
    newEvaluation.Nodes = splittedLastLine[3];
    newEvaluation.Errors = splittedLastLine[4];
    newEvaluation.Tag_Count = splittedLastLine[5];
    newEvaluation.Element_Count = splittedLastLine[6];
    newEvaluation.A = this.calculateNotConformant("A", data);
    newEvaluation.AA = this.calculateNotConformant("AA", data);
    newEvaluation.AAA = this.calculateNotConformant("AAA", data);
    newEvaluation.Evaluation_Date = new Date(splittedFirstLine[1]);
    newEvaluation.Show_To = "10";

    return this.createOne(newEvaluation);
  }

  async postMyMonitorAMPExtensionEvaluation(pageId: number, data: string[]): Promise<any> {
    const splittedFirstLine = data[0].split(";");
    const splittedLastLine = data[data.length - 1].split(";");

    const newEvaluation = new Evaluation();
    newEvaluation.PageId = pageId;

    newEvaluation.Score = splittedFirstLine[9].replace(",", ".");
    newEvaluation.Pagecode = splittedLastLine[1];
    newEvaluation.Tot = splittedLastLine[2];
    newEvaluation.Nodes = splittedLastLine[3];
    newEvaluation.Errors = splittedLastLine[4];
    newEvaluation.Tag_Count = splittedLastLine[5];
    newEvaluation.Element_Count = splittedLastLine[6];
    newEvaluation.A = this.calculateNotConformant("A", data);
    newEvaluation.AA = this.calculateNotConformant("AA", data);
    newEvaluation.AAA = this.calculateNotConformant("AAA", data);
    newEvaluation.Evaluation_Date = new Date(splittedFirstLine[1]);
    newEvaluation.Show_To = "01";

    return this.createOne(newEvaluation);
  }

  private calculateNotConformant(type: string, data: string[]): number {
    let total = 0;
    switch (type) {
      case "A":
      case "AA":
      case "AAA":
        data.map((l) => {
          const splittedLine = l.split(";");
          if (splittedLine[4] === type && splittedLine[3] === "Erro") {
            total++;
          }
        });
        break;
      default:
        break;
    }
    return total;
  }

  async increaseAMSObservatoryRequestCounter(): Promise<void> {
    await this.connection.query(
      `UPDATE Evaluation_Request_Counter SET Counter = Counter + 1, Last_Request = NOW() WHERE Application = "AMS/Observatory"`
    );
  }

  async increaseMyMonitorRequestCounter(): Promise<void> {
    await this.connection.query(
      `UPDATE Evaluation_Request_Counter SET Counter = Counter + 1, Last_Request = NOW() WHERE Application = "MyMonitor"`
    );
  }

  async increaseStudyMonitorRequestCounter(): Promise<void> {
    await this.connection.query(
      `UPDATE Evaluation_Request_Counter SET Counter = Counter + 1, Last_Request = NOW() WHERE Application = "StudyMonitor"`
    );
  }

  async increaseAccessMonitorRequestCounter(): Promise<void> {
    await this.connection.query(
      `UPDATE Evaluation_Request_Counter SET Counter = Counter + 1, Last_Request = NOW() WHERE Application = "AccessMonitor"`
    );
  }

  async getAMSObservatoryRequestCounter(): Promise<any> {
    const counter = await this.connection.query(
      `SELECT * FROM Evaluation_Request_Counter WHERE Application = "AMS/Observatory" LIMIT 1`
    );
    if (counter[0])
      return { counter: counter[0].Counter, date: counter[0].Start_Date };
    return { counter: 0, date: '' };
  }

  async getMyMonitorRequestCounter(): Promise<any> {
    const counter = await this.connection.query(
      `SELECT * FROM Evaluation_Request_Counter WHERE Application = "MyMonitor" LIMIT 1`
    );
    if (counter[0])
      return { counter: counter[0].Counter, date: counter[0].Start_Date };
    return { counter: 0, date: '' };
  }

  async getStudyMonitorRequestCounter(): Promise<any> {
    const counter = await this.connection.query(
      `SELECT * FROM Evaluation_Request_Counter WHERE Application = "StudyMonitor" LIMIT 1`
    );
    if (counter[0])
      return { counter: counter[0].Counter, date: counter[0].Start_Date };
    return { counter: 0, date: '' };
  }

  async getAccessMonitorRequestCounter(): Promise<any> {
    const counter = await this.connection.query(
      `SELECT * FROM Evaluation_Request_Counter WHERE Application = "AccessMonitor" LIMIT 1`
    );
    if (counter[0])
      return { counter: counter[0].Counter, date: counter[0].Start_Date };
    return { counter: 0, date: '' };
  }

  async resetAdminWaitingList(): Promise<boolean> {
    await this.connection.query(
      `UPDATE Evaluation_List SET Is_Evaluating = 0, Error = NULL WHERE UserId = -1`
    );
    return true;
  }

  async deleteAdminWaitingList(): Promise<boolean> {
    await this.connection.query(
      `DELETE FROM Evaluation_List WHERE UserId = -1`
    );
    return true;
  }

  async resetMMWaitingList(): Promise<boolean> {
    await this.connection.query(
      `UPDATE 
        Evaluation_List as el, User as u
      SET 
        el.Is_Evaluating = 0, 
        el.Error = NULL 
      WHERE 
        el.UserId <> -1 AND
        u.UserId = el.UserId AND
        u.Type = "monitor"`
    );
    return true;
  }

  async deleteMMWaitingList(): Promise<boolean> {
    await this.connection.query(
      `DELETE el.* FROM Evaluation_List as el, User as u 
       WHERE 
        el.UserId <> -1 AND
        u.UserId = el.UserId AND
        u.Type = "monitor"`
    );
    return true;
  }

  async resetSMWaitingList(): Promise<boolean> {
    await this.connection.query(
      `UPDATE 
        Evaluation_List as el, User as u
      SET 
        el.Is_Evaluating = 0, 
        el.Error = NULL 
      WHERE 
        el.UserId <> -1 AND
        u.UserId = el.UserId AND
        u.Type = "studies"`
    );
    return true;
  }

  async deleteSMWaitingList(): Promise<boolean> {
    await this.connection.query(
      `DELETE el.* FROM Evaluation_List as el, User as u 
       WHERE 
        el.UserId <> -1 AND
        u.UserId = el.UserId AND
        u.Type = "studies"`
    );
    return true;
  }

  async findMyMonitorUserWebsitePageEvaluations(
    userId: number,
    website: string
  ): Promise<any> {
    const evaluations = await this.connection.query(
      `SELECT e.*, p.Uri 
      FROM
        Website as w,
        WebsitePage as wp,
        Page as p,
        Evaluation as e
      WHERE
        w.Name = ? AND
        w.UserId = ? AND
        wp.WebsiteId = w.WebsiteId AND
        p.PageId = wp.PageId AND
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
    const evaluation = (
      await this.connection.query(
        `SELECT e.* 
      FROM
        Website as w,
        WebsitePage as wp,
        Page as p,
        Evaluation as e
      WHERE
        w.Name = ? AND
        w.UserId = ? AND
        wp.WebsiteId = w.WebsiteId AND
        p.PageId = wp.PageId AND
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
    const evaluations = await this.connection.query(
      `SELECT e.*, p.Uri
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w,
        WebsitePage as wp,
        Page as p,
        Evaluation as e
      WHERE
        t.Name = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.Name = ? AND
        w.UserId = t.UserId AND
        wp.WebsiteId = w.WebsiteId AND
        p.PageId = wp.PageId AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId AND StudyUserId = w.UserId)
      `,
      [tag, userId, website]
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
    const evaluation = (
      await this.connection.query(
        `SELECT e.* 
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w,
        WebsitePage as wp,
        Page as p,
        Evaluation as e
      WHERE
        t.Name = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.Name = ? AND
        w.UserId = ? AND
        wp.WebsiteId = w.WebsiteId AND
        p.PageId = wp.PageId AND
        p.Uri = ? AND 
        e.PageId = p.PageId AND
        e.StudyUserId = ?
      ORDER BY e.Evaluation_Date DESC 
      LIMIT 1`,
        [tag, userId, website, userId, url, userId]
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
    let query = "";

    if (type === "admin") {
      query = `SELECT distinct e.EvaluationId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date, e.Element_Count, e.Tag_Count
        FROM
          User as u,
          Website as w,
          WebsitePage as wp,
          Page as p,
          Evaluation as e
        WHERE
          p.Uri = ? AND
          p.Show_In LIKE "1%%" AND
          e.PageId = p.PageId AND
          e.Show_To LIKE "1_" AND
          wp.PageId = p.PageId AND
          w.WebsiteId = wp.WebsiteId AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type = "monitor"))
        ORDER BY e.Evaluation_Date DESC`;
    } else if (type === "monitor") {
      query = `SELECT distinct e.EvaluationId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date
        FROM
          User as u,
          Website as w,
          WebsitePage as wp,
          Page as p,
          Evaluation as e
        WHERE
          p.Uri = ? AND
          p.Show_In LIKE "11%" AND
          e.PageId = p.PageId AND
          e.Show_To LIKE "_1" AND
          wp.PageId = p.PageId AND
          w.WebsiteId = wp.WebsiteId AND
          u.UserId = w.UserId AND 
          u.Type = "monitor"
        ORDER BY e.Evaluation_Date DESC`;
    } else if (type === "studies") {
      query = `SELECT distinct e.EvaluationId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date
        FROM
          Page as p,
          Evaluation as e
        WHERE
          p.Uri = ? AND
          e.PageId = p.PageId
        ORDER BY e.Evaluation_Date DESC
        LIMIT 1`;
    } else {
      throw new InternalServerErrorException();
    }

    const evaluations = await this.connection.query(query, [page]);
    return evaluations;
  }

  async findEvaluationById(url: string, id: number): Promise<any> {
    const evaluation = await this.evaluationRepository.findOne({
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

    const evaluation = (await this.connection.query(query, [url]))[0];

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

  async findWebsiteEvaluations(website: string, sample: boolean): Promise<any> {
    const evaluations = await this.connection.query(
      `SELECT distinct e.*, p.Uri
      FROM
        Website as w,
        WebsitePage as wp,
        Page as p,
        Evaluation as e
      WHERE
        w.StartingUrl = ? AND
        wp.WebsiteId = w.WebsiteId AND
        p.PageId = wp.PageId AND
        p.Show_In LIKE ? AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId AND Show_To LIKE '1_')
      `,
      [website, sample ? "1__" : "1_1"]
    );

    const reports = new Array<any>();

    for (const evaluation of evaluations || []) {
      const tot = JSON.parse(Buffer.from(evaluation.Tot, "base64").toString());
      reports.push({
        // pagecode: Buffer.from(evaluation.Pagecode, "base64").toString(), // removed because is not used upstream and is too big
        pagecode: "",
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
