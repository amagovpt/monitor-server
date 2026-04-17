import {  Injectable, InternalServerErrorException, OnModuleInit } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import fs, { createReadStream } from "node:fs";
import * as readline from 'node:readline';
import { readdir, stat } from 'node:fs/promises';
import { Evaluation } from "./evaluation.entity";
import {
  executeUrlEvaluation,
  executeUrlsEvaluation,
  executeHtmlEvaluation,
} from "./middleware";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class EvaluationService  implements OnModuleInit {
  private currentProcessingIds: number[] = [];
  private APP_INSTANCE = process.env.NODE_APP_INSTANCE || '0';
  constructor(
    @InjectDataSource()
    private readonly connection: DataSource,
    @InjectRepository(Evaluation)
    private readonly evaluationRepository: Repository<Evaluation>
  ) {
  }
  async onModuleInit() {
    const instanceId = `LOCK_${process.env.NAMESPACE}_${this.APP_INSTANCE}`;


    console.log(`[BOOT] NODE_APP_INSTANCE: ${this.APP_INSTANCE} initialized. Checking if any orphan evaluations exist...`);

    try {

      const result = await this.connection.query(
        `UPDATE Evaluation_List 
         SET Is_Evaluating = 0, Error = NULL 
         WHERE Is_Evaluating = 1 
           AND Error = ?`,
        [instanceId]
      );

      if (result.affectedRows > 0) {
        console.warn(
          `[SELF-HEALING] APP_INSTANCE:${this.APP_INSTANCE} - Successs: ${result.affectedRows} evaluations orphan cleaned.`.green
        );
      } else {
        console.log(`[BOOT] APP_INSTANCE:${this.APP_INSTANCE} - No orphan evaluations found  .`.green);
      }
    } catch (err) {
      console.error(`[BOOT-ERROR] APP_INSTANCE:${this.APP_INSTANCE} - Failed while trying to clean orphan evaluations: ${err.message}`.red);
    }
  
      this.setupShutdownHandlers();
  }
  private setupShutdownHandlers() {
    
  const signals = ['SIGINT', 'SIGTERM'];

  signals.forEach((signal) => {
    
    process.on(signal, async () => {
      
      console.warn(`\n[${signal}] Shutdown detected. Releasing resources...`.yellow);

      if (this.currentProcessingIds.length > 0) {
        try {
          console.log(`[CLEANUP] Releasing IDs in DB: ${this.currentProcessingIds}`.yellow);
          
          await this.connection.query(
            `UPDATE Evaluation_List SET Is_Evaluating = 0, Error = NULL WHERE EvaluationListId IN (?)`,
            [this.currentProcessingIds]
          );
          
          console.log(`[CLEANUP] Success: Evaluations with IDs [${this.currentProcessingIds}] released. `.green);
        } catch (err) {
          console.error(`[CLEANUP-ERROR]  Failure:` .red, err.message);
        }
      } else {
        console.log(`[CLEANUP] No pages in progress.`.green);
      }

      console.log(`[SHUTDOWN] Instance terminated.`.green);
      

      process.exit(0); 
    });
  })
}
  public getCurrentProcessingIds(): number[] {
    return this.currentProcessingIds;

  }
  //FIXME confirmar se as paginas têm sempre avaliação
  async getLastEvaluationByPage(pageId: number): Promise<Evaluation>  {
    const evaluationList = await this.evaluationRepository.find({
      where: { PageId: pageId },
      take: 1,
      order: { Evaluation_Date: "DESC" },
    });
    return evaluationList[0];
  }

private async findUrlError(url: string): Promise<string> {
  const now = Date.now();
  const TWENTY_MINUTES_MS = 20 * 60 * 1000;

  try {
    const files = await readdir("./");
    
    const filesWithStats = await Promise.all(
      files
        .filter(f => f.startsWith("qualweb-errors"))
        .map(async f => ({ name: f, stats: await stat(f) }))
    );

    const recentFiles = filesWithStats
      .filter(f => (now - f.stats.mtimeMs) < TWENTY_MINUTES_MS)
      .sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);

    for (const file of recentFiles) {
      const rl = readline.createInterface({
        input: createReadStream(file.name),
        crlfDelay: Infinity
      });

      for await (const line of rl) {
        if (line.includes(url)) {
          const split = line.split(url);
          const error = split[1]?.split("-----------")[0]?.split(":")?.slice(1).join(":").trim();
          if (error) {
            rl.close(); 
            return error;
          }
        }
      }
    }
  } catch (err) {
    return "Error extraction failed.";
  }
  return "No error found for URL. Please check server logs for more details.";
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


@Cron(CronExpression.EVERY_10_SECONDS)
async instanceEvaluateAdminPageList(): Promise<void> {
  
  if (process.env.NAMESPACE !== undefined && process.env.NAMESPACE !== "ADMIN") return;

  const queryRunner = this.connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const [status] = await queryRunner.manager.query(
      `SELECT COUNT(*) as total FROM Evaluation_List WHERE Is_Evaluating = 1 AND UserId = -1 `
    );

    const totalInQueue = parseInt(status.total);
    if (totalInQueue >= 30) {
      console.warn(`[Queue Full] APP_INSTANCE:${this.APP_INSTANCE} - Evaluation Queue cannot hold more active works at this moment- Queue : ${totalInQueue}/30`.yellow);
      await queryRunner.rollbackTransaction();
      return;
    }
    const instanceId = `LOCK_ADMIN_${this.APP_INSTANCE}`;
    const batchSize = Math.min(10, 30 - totalInQueue);


    const pagesToLock = await queryRunner.manager.query(`
      SELECT EvaluationListId 
      FROM Evaluation_List 
      WHERE Is_Evaluating = 0 
        AND Error IS NULL 
        AND UserId = -1
      ORDER BY Creation_Date ASC, EvaluationListId ASC
      LIMIT ?
      FOR UPDATE SKIP LOCKED
    `, [batchSize]);

    if (pagesToLock.length > 0) {
      const ids = pagesToLock.map(p => p.EvaluationListId);

      await queryRunner.manager.query(`
        UPDATE Evaluation_List 
        SET Is_Evaluating = 1, Error = ?
        WHERE EvaluationListId IN (?)
      `, [instanceId, ids]);

      const pages = await queryRunner.manager.query(
        `SELECT * FROM Evaluation_List WHERE EvaluationListId IN (?)`,
        [ids]
      );

      await queryRunner.commitTransaction();

      this.currentProcessingIds.push(...ids);
      
      try {
        await this.evaluateInBackground(pages);
      } finally {
        this.currentProcessingIds = this.currentProcessingIds.filter(id => !ids.includes(id));
      }
    } else {
      await queryRunner.rollbackTransaction();
    }
  } catch (err) {
    console.error(`[CRITICAL] APP_INSTANCE:${this.APP_INSTANCE} - Failure in orchestration of evaluation: ${err.message}`.red);
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
  } finally {
    // Libertar o worker para o pool
    await queryRunner.release();
  }
}


@Cron(CronExpression.EVERY_30_SECONDS)
async instanceEvaluateUserPageList(): Promise<void> {

  if (process.env.NAMESPACE !== undefined && process.env.NAMESPACE !== "USER") return;

  const queryRunner = this.connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const [status] = await queryRunner.manager.query(
      `SELECT COUNT(*) as total FROM Evaluation_List WHERE Is_Evaluating = 1 AND UserId <> -1 `
    );

    const totalInQueue = parseInt(status.total);
    if (totalInQueue >= 20) {
      console.warn(`[Queue Full] APP_INSTANCE:${this.APP_INSTANCE} - Evaluation Queue cannot hold more active works at this moment- Queue : ${totalInQueue}/20`.yellow);
      await queryRunner.rollbackTransaction();
      return;
    }
    const instanceId = `LOCK_USER_${this.APP_INSTANCE}`;
    const batchSize = Math.min(10, 20 - totalInQueue);


    const pagesToLock = await queryRunner.manager.query(`
      SELECT EvaluationListId 
      FROM Evaluation_List 
      WHERE Is_Evaluating = 0 
        AND Error IS NULL 
        AND UserId <> -1
      ORDER BY Creation_Date ASC, EvaluationListId ASC
      LIMIT ?
      FOR UPDATE SKIP LOCKED
    `, [batchSize]);

    if (pagesToLock.length > 0) {
      const ids = pagesToLock.map(p => p.EvaluationListId);

      await queryRunner.manager.query(`
        UPDATE Evaluation_List 
        SET Is_Evaluating = 1, Error = ?
        WHERE EvaluationListId IN (?)
      `, [instanceId, ids]);

      const pages = await queryRunner.manager.query(
        `SELECT * FROM Evaluation_List WHERE EvaluationListId IN (?)`,
        [ids]
      );

      await queryRunner.commitTransaction();

      this.currentProcessingIds.push(...ids);
      
      try {
        await this.evaluateInBackground(pages);
      } finally {
        this.currentProcessingIds = this.currentProcessingIds.filter(id => !ids.includes(id));
      }
    } else {
      await queryRunner.rollbackTransaction();
    }
  } catch (err) {
    console.error(`[CRITICAL] APP_INSTANCE:${this.APP_INSTANCE} - Failure in orchestration of evaluation: ${err.message}`.red);
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
  } finally {
    await queryRunner.release();
  }
}
 
  @Cron(CronExpression.EVERY_10_MINUTES)
  async evaluateStuckPages(): Promise<void> {
    const pages = await this.connection.query(
      `SELECT * FROM Evaluation_List WHERE Is_Evaluating = 1 AND (Error IS NULL OR Error LIKE 'LOCK_%') AND Creation_Date < DATE_SUB(NOW(), INTERVAL 2 HOUR)`
    );

    if (pages.length > 0) {
      try {
        await this.connection.query(
          `UPDATE Evaluation_List SET Is_Evaluating = 0, Error = NULL WHERE EvaluationListId IN (?)`,
          [pages.map((p) => p.EvaluationListId)]
        );
      } catch (err) {
        console.error(`[CRITICAL] APP_INSTANCE:${this.APP_INSTANCE} - Failure in evaluating stuck pages: ${err.message}`.red);
        throw err;
      }
    }
  }


  private async evaluateInBackground(pages: any[]): Promise<void> {
    if (pages.length > 0) {
      try {
        await this.connection.query(
          `UPDATE Evaluation_List SET Is_Evaluating = 1 WHERE EvaluationListId IN (?)`,
          [pages.map((p) => p.EvaluationListId)]
        );
      } catch (err) {
        console.error(`[CRITICAL] APP_INSTANCE:${this.APP_INSTANCE} - Failure in updating evaluation list: ${err.message}`.red);
        throw err;
      }

      let reports = {};

      try {
        reports = await this.evaluateUrls(pages.map((p) => p.Url));
      } catch (err) {
        console.error(`[CRITICAL] APP_INSTANCE:${this.APP_INSTANCE} - Failure in evaluating URLs: ${err.message}`.red);
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
          const error = await this.findUrlError(pte.Url);
          await queryRunner.manager.query(
            `UPDATE Evaluation_List SET Error = ? , Is_Evaluating = 0 WHERE EvaluationListId = ?`,
            [error, pte.EvaluationListId]
          );
        }
      }

      try {
        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        console.error(err);
      } finally {
        await queryRunner.release();
      }

  
    }
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
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {

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

  async postAMPExtensionEvaluation(pageId: number, data: string): Promise<any> {
    const splittedData = data.split(";");

    const newEvaluation = new Evaluation();
    newEvaluation.PageId = pageId;

    newEvaluation.Score = splittedData[8].replace(",", ".");
    newEvaluation.Pagecode = splittedData[1];
    newEvaluation.Tot = splittedData[3];
    newEvaluation.Nodes = splittedData[4];
    newEvaluation.Errors = splittedData[5];
    newEvaluation.Tag_Count = splittedData[6];
    newEvaluation.Element_Count = splittedData[7];
    newEvaluation.A = parseInt(splittedData[2].split("@")[0]);
    newEvaluation.AA = parseInt(splittedData[2].split("@")[1]);
    newEvaluation.AAA = parseInt(splittedData[2].split("@")[2]);
    newEvaluation.Evaluation_Date = new Date(splittedData[9]);
    newEvaluation.Show_To = "10";

    return this.createOne(newEvaluation);
  }

  async postMyMonitorAMPExtensionEvaluation(pageId: number, data: string): Promise<any> {
    const splittedData = data.split(";");

    const newEvaluation = new Evaluation();
    newEvaluation.PageId = pageId;

    newEvaluation.Score = splittedData[8].replace(",", ".");
    newEvaluation.Pagecode = splittedData[1];
    newEvaluation.Tot = splittedData[3];
    newEvaluation.Nodes = splittedData[4];
    newEvaluation.Errors = splittedData[5];
    newEvaluation.Tag_Count = splittedData[6];
    newEvaluation.Element_Count = splittedData[7];
    newEvaluation.A = parseInt(splittedData[2].split("@")[0]);
    newEvaluation.AA = parseInt(splittedData[2].split("@")[1]);
    newEvaluation.AAA = parseInt(splittedData[2].split("@")[2]);
    newEvaluation.Evaluation_Date = new Date(splittedData[9]);
    newEvaluation.Show_To = "01";

    return this.createOne(newEvaluation);
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
