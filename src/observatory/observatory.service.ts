import { Injectable } from '@nestjs/common';
import { Connection, getManager } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class ObservatoryService {

  constructor(private readonly connection: Connection) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async generateData(): Promise<void> {
    
  }

  async getData(): Promise<any> {
    const manager = getManager();

    let data = new Array<any>();

    const directories = await manager.query(
      `SELECT * FROM Directory WHERE Show_in_Observatory = 1`
    );

    for (const directory of directories) {
      const tags = await manager.query(
        `SELECT t.* FROM DirectoryTag as dt, Tag as t WHERE dt.DirectoryId = ? AND t.TagId = dt.TagId`,
        [directory.DirectoryId]
      );
      const tagsId = tags.map((t) => t.TagId);
      
      let pages = null;
      if (parseInt(directory.Method) === 0) {
        pages = await manager.query(
          `
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
            w.Declaration as Website_Declaration,
            w.Declaration_Update_Date as Declaration_Date,
            w.Stamp as Website_Stamp,
            w.Stamp_Update_Date as Stamp_Date,
            w.Creation_Date as Website_Creation_Date
          FROM
            TagWebsite as tw,
            Website as w,
            Domain as d,
            DomainPage as dp,
            Page as p
            LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date = (
              SELECT Evaluation_Date FROM Evaluation 
              WHERE PageId = p.PageId AND Show_To LIKE "1_"
              ORDER BY Evaluation_Date DESC LIMIT 1
            )
          WHERE
            tw.TagId IN (?) AND
            w.WebsiteId = tw.WebsiteId AND
            d.WebsiteId = w.WebsiteId AND
            d.Active = 1 AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId AND
            p.Show_In LIKE "__1"
          GROUP BY
            w.WebsiteId, p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Tot, e.Evaluation_Date
          HAVING
            COUNT(w.WebsiteId) = ?`,
          [tagsId, tagsId.length]
        );
      } else {
        pages = await manager.query(
          `
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
            w.Declaration as Website_Declaration,
            w.Declaration_Update_Date as Declaration_Date,
            w.Stamp as Website_Stamp,
            w.Stamp_Update_Date as Stamp_Date,
            w.Creation_Date as Website_Creation_Date
          FROM
            TagWebsite as tw,
            Website as w,
            Domain as d,
            DomainPage as dp,
            Page as p
            LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date = (
              SELECT Evaluation_Date FROM Evaluation 
              WHERE PageId = p.PageId AND Show_To LIKE "1_"
              ORDER BY Evaluation_Date DESC LIMIT 1
            )
          WHERE
            tw.TagId IN (?) AND
            w.WebsiteId = tw.WebsiteId AND
            d.WebsiteId = w.WebsiteId AND
            d.Active = 1 AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId AND
            p.Show_In LIKE "__1"
          GROUP BY
            w.WebsiteId, p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Tot, e.Evaluation_Date`,
          [tagsId]
        );
      }
      if (pages) {
        pages = pages.filter((p) => p.Score !== null);

        for (const p of pages || []) {
          p.DirectoryId = directory.DirectoryId;
          p.Directory_Name = directory.Name;
          p.Show_in_Observatory = directory.Show_in_Observatory;
          p.Directory_Creation_Date = directory.Creation_Date;
          p.Entity_Name = null;
          
          const entities = await manager.query(
            `
            SELECT e.Long_Name
            FROM
              EntityWebsite as ew,
              Entity as e
            WHERE
              ew.WebsiteId = ? AND
              e.EntityId = ew.EntityId
          `,
            [p.WebsiteId]
          );
          
          if (entities.length > 0) {
            if (entities.length === 1) {
              p.Entity_Name = entities[0].Long_Name;
            } else {
              p.Entity_Name = entities.map((e) => e.Long_Name).join("@,@ ");
            }
          }
        }

        data = [...data, ...pages];
      }
    }

    return data;
  }
}
