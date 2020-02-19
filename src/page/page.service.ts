import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getManager } from 'typeorm';
import { Page } from './page.entity';

@Injectable()
export class PageService {

  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>
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
    return getManager().query(`
      SELECT
        e.EvaluationId,
        e.Title,
        e.Score,
        e.Errors,
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
}
