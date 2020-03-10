import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, getManager } from 'typeorm';
import { Domain } from './domain.entity';

@Injectable()
export class DomainService {

  constructor(
    @InjectRepository(Domain)
    private readonly domainRepository: Repository<Domain>,
    private readonly connection: Connection
  ) {}

  async findAll(): Promise<any> {
    const manager = getManager();
    const domains = await manager.query(`SELECT d.*, COUNT(distinct p.PageId) as Pages, u.Username as User
      FROM
        Domain as d
        LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
        LEFT OUTER JOIN Page as p ON p.PageId = dp.PageId AND p.Show_In LIKE "1%%"
        LEFT OUTER JOIN Website as w ON w.WebsiteId = d.WebsiteId
        LEFT OUTER JOIN User as u ON u.UserId = w.UserId
      WHERE
        (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) != 'studies')) AND
        w.Deleted = "0"
      GROUP BY d.DomainId`);
    return domains;
  }

  async findAllOfficial(): Promise<any> {
    const manager = getManager();
    const domains = await manager.query(`SELECT
        d.*,
        COUNT(distinct dp.PageId) as Pages
      FROM
        Domain as d
        LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId,
        Website as w,
        User as u
      WHERE
        d.Active = '1' AND
        w.WebsiteId = d.WebsiteId AND
        (
          w.UserId IS NULL OR
          (
            u.UserId = w.UserId AND
            LOWER(u.Type) != 'studies'
          )
        ) AND
        w.Deleted = "0"
      GROUP BY d.DomainId`);
    return domains;
  }

  async findByUrl(url: string): Promise<any> {
    return this.domainRepository.findOne({ where: { Url: url }});
  }

  async findMyMonitorUserWebsiteDomain(userId: number, website: string): Promise<any> {
    const manager = getManager();
    const domain = await manager.query(`SELECT d.Url FROM 
        Website as w,
        Domain as d
      WHERE
        w.UserId = ? AND
        LOWER(w.Name) = ? AND
        d.WebsiteId = w.WebsiteId AND
        d.Active = 1
      LIMIT 1`, [userId, website]);

    return domain ? domain[0].Url : null;
  }

  async findStudyMonitorUserTagWebsiteDomain(userId: number, tag: string, website: string): Promise<any> {
    const manager = getManager();

    const domain = await manager.query(`SELECT d.Url FROM 
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d
      WHERE
        LOWER(t.Name) = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = ? AND
        LOWER(w.Name) = ? AND
        d.WebsiteId = w.WebsiteId
      LIMIT 1`, [tag.toLowerCase(), userId, userId, website.toLowerCase()]);

    return domain ? domain[0].Url : null;
  }

  async findUserType(username: string): Promise<any> {
    if (username === 'admin') {
      return 'nimda';
    }

    const user = await getManager().query(`SELECT * FROM User WHERE Username = ? LIMIT 1`, [username]);

    if (user) {
      return user[0].Type;
    } else {
      return null;
    }
  }

  async findAllDomainPages(user: string, type: string, domain: string, flags: string): Promise<any> {
    const manager = getManager();
    
    if (type === 'nimda') {
      const pages = await manager.query(`SELECT 
          p.*,
          e.A,
          e.AA,
          e.AAA,
          e.Score,
          e.Errors,
          e.Evaluation_Date 
        FROM 
          Page as p
          LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Evaluation_Date = (
            SELECT Evaluation_Date FROM Evaluation 
            WHERE PageId = p.PageId 
            ORDER BY Evaluation_Date DESC LIMIT 1
          ),
          User as u,
          Website as w,
          Domain as d,
          DomainPage as dp
        WHERE
          (
            LOWER(u.Type) = "monitor" AND
            w.UserId = u.UserId AND
            d.WebsiteId = w.WebsiteId AND
            LOWER(d.Url) = ? AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId AND
            p.Show_In LIKE ?
          )
          OR
          (
            w.UserId IS NULL AND
            d.WebsiteId = w.WebsiteId AND
            LOWER(d.Url) = ? AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId AND
            p.Show_In LIKE ?
          )
        GROUP BY p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Evaluation_Date`, [domain.toLowerCase(), flags, domain.toLowerCase(), flags]);
      
      return pages;
    } else {
      const pages = await manager.query(`SELECT 
          p.*,
          e.A,
          e.AA,
          e.AAA,
          e.Score,
          e.Errors,
          e.Evaluation_Date 
        FROM 
          Page as p
          LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Evaluation_Date = (
            SELECT Evaluation_Date FROM Evaluation 
            WHERE PageId = p.PageId 
            ORDER BY Evaluation_Date DESC LIMIT 1
          ),
          User as u,
          Website as w,
          Domain as d,
          DomainPage as dp
        WHERE
          LOWER(u.Username) = ? AND
          w.UserId = u.UserId AND
          d.WebsiteId = w.WebsiteId AND
          LOWER(d.Url) = ? AND
          dp.DomainId = d.DomainId AND
          p.PageId = dp.PageId AND
          p.Show_In LIKE ?
        GROUP BY p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Evaluation_Date`, [user.toLowerCase(), domain.toLowerCase(), flags]);

      return pages;
    }
  }
}
