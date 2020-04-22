import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, getManager, IsNull, In } from 'typeorm';
import { Tag } from './tag.entity';
import { Website } from '../website/website.entity';
import { Domain } from '../domain/domain.entity';

@Injectable()
export class TagService {

  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    private readonly connection: Connection
  ) {}

  async addPagesToEvaluate(tagId: number, option: string): Promise<boolean> {
    const pages = await this.tagRepository.query(`
      SELECT
        p.PageId, 
        p.Uri
      FROM
        TagWebsite as tw,
        Website as w,
        Domain as d,
        DomainPage as dp,
        Page as p
      WHERE
        tw.TagId = ? AND
        w.WebsiteId = tw.WebsiteId AND
        d.WebsiteId = w.WebsiteId AND
        d.Active = 1 AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        p.Show_In LIKE ?
    `, [tagId, option === 'all' ? '1__' : '1_1']);

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    
    await queryRunner.startTransaction();

    let error = false;
    try {
      for (const page of pages || []) {
        await queryRunner.manager.query(`INSERT INTO Evaluation_List (PageId, Url, Show_To, Creation_Date) VALUES (?, ?, ?, ?)`, [page.PageId, page.Uri, '10', new Date()]);
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      console.log(err);
      error = true;
    } finally {
      await queryRunner.release();
    }

    return !error;
  }

  findByTagName(tagName: string): Promise<Tag | undefined> {
    return this.tagRepository.findOne({ where: { Name: tagName } });
  }

  findByOfficialTagName(tagName: string): Promise<Tag | undefined> {
    return this.tagRepository.findOne({ where: { Name: tagName.toLowerCase(), UserId: IsNull() }});
  }

  async findInfo(tagId: number): Promise<any> {
    const tags = await this.tagRepository.query(`SELECT t.*, u.Username FROM Tag as t LEFT OUTER JOIN User as u ON u.UserId = t.UserId WHERE TagId = ? LIMIT 1`, [tagId]);
  
    if (tags) {
      const tag = tags[0];

      tag.websites = await this.tagRepository.query(`SELECT w.* 
        FROM
          TagWebsite as tw,
          Website as w 
        WHERE
          tw.TagId = ? AND 
          w.WebsiteId = tw.WebsiteId`, [tagId]);

      return tag;
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findAll(): Promise<any> {
    const manager = getManager();
    const tags = await manager.query(`SELECT 
        t.*,
        COUNT(distinct tw.WebsiteId) as Websites 
      FROM 
        Tag as t
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
      WHERE
        t.UserId IS NULL
      GROUP BY t.TagId`);
    
    return tags;
  }

  async findAllOfficial(): Promise<any> {
    return this.tagRepository.find({ where: { UserId: IsNull() } });
  }

  async findNumberOfStudyMonitor(): Promise<number> {
    const manager = getManager();
    return (await manager.query(`SELECT COUNT(t.TagId) as Tags FROM Tag as t, User as u WHERE LOWER(u.Type) = "studies" AND t.UserId = u.UserId`))[0].Tags;
  }

  async findNumberOfObservatory(): Promise<number> {
    return this.tagRepository.count({ Show_in_Observatorio: 1 });
  }

  async findAllFromStudyMonitorUser(userId: number): Promise<any> {
    const manager = getManager();
    const tags = await manager.query(`SELECT 
        distinct t.*, 
        COUNT(distinct tw.WebsiteId) as Websites,
        COUNT(distinct dp.PageId) as Pages 
      FROM 
        Tag as t
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
        LEFT OUTER JOIN Domain as d ON d.WebsiteId = tw.WebsiteId
        LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
      WHERE 
        t.UserId = ?
      GROUP BY t.TagId`, [userId]);

    return tags;
  }

  async findStudyMonitorUserTagData(userId: number, tag: string): Promise<any> {
    const manager = getManager();
    const pages = await manager.query(`SELECT
        w.WebsiteId,
        w.Name,
        d.Url,
        p.Uri,
        e.Score,
        e.Tot,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date
      FROM 
        Page as p,
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d,
        DomainPage as dp,
        Evaluation as e
      WHERE
        LOWER(t.Name) = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = ? AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId);`, [tag.toLowerCase(), userId, userId]);

    return pages;
  }

  async findStudyMonitorUserTagWebsitesPagesData(userId: number, tag: string, website: string): Promise<any> {
    const manager = getManager();
    const pages = await manager.query(`SELECT 
        distinct p.*,
        e.Score,
        e.Tot,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date
      FROM 
        Page as p,
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d,
        DomainPage as dp,
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
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId);`, [tag.toLowerCase(), userId, website.toLowerCase(), userId]);

    return pages;
  }

  async getUserId(username: string): Promise<any> {
    return (await getManager().query('SELECT * FROM User WHERE Username = ? LIMIT 1', [username]))[0].UserId;
  }

  async findAllUserWebsitePages(tag: string, website: string, user: string): Promise<any> {
    const userId = await this.getUserId(user);
    const manager = getManager();

    const websiteExists = await manager.query(`SELECT * FROM Website WHERE UserId = ? AND LOWER(Name) = ? LIMIT 1`, [userId, website.toLowerCase()]);
    
    if (tag !== 'null') {
      if (websiteExists) {
        const pages = await manager.query(`SELECT 
            distinct p.*,
            e.Score,
            e.A,
            e.AA,
            e.AAA,
            e.Evaluation_Date
          FROM 
            Page as p,
            Tag as t,
            TagWebsite as tw,
            Website as w,
            Domain as d,
            DomainPage as dp,
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
            e.PageId = p.PageId AND
            e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId)`, [tag.toLowerCase(), userId, website.toLowerCase(), userId]);

        return pages;
      }
    } else {
      if (websiteExists) {
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
            e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId)`, [website, userId]);
        
        return pages;
      }
    }
  }

  async createOne(tag: Tag, websites: number[]): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertTag = await queryRunner.manager.save(tag);

      for (const websiteId of websites || []) {
        await queryRunner.manager.query(`INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`, [insertTag.TagId, websiteId]);
      }

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

  async createUserTag(tag: Tag, type: string, tagsId: number[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      if (type === 'official' || type === 'user') {
        const insertTag = await queryRunner.manager.save(tag);

        if (type === 'official') {
          let websites = null;
          if (tagsId.length > 1) {
            websites = await queryRunner.manager.query(`SELECT w.Name, d.DomainId, d.Url, d.Start_Date
              FROM 
                TagWebsite as tw
                LEFT OUTER JOIN Website as w ON w.WebsiteId = tw.WebsiteId
                LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
              WHERE 
                tw.TagId IN (?)
              GROUP BY
                w.Name, d.DomainId, d.Url, d.Start_Date
              HAVING
                COUNT(tw.WebsiteId) = ?`, [tagsId, tagsId.length]);
          } else {
            websites = await queryRunner.manager.query(`SELECT w.Name, d.DomainId, d.Url, d.Start_Date
              FROM 
                TagWebsite as tw
                LEFT OUTER JOIN Website as w ON w.WebsiteId = tw.WebsiteId
                LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
              WHERE 
                tw.TagId = ?
              GROUP BY
                w.Name, d.DomainId, d.Url, d.Start_Date`, [tagsId[0]]);
          }

          for (const website of websites || []) {
            const newWebsite = new Website();
            newWebsite.Name = website.Name;
            newWebsite.UserId = tag.UserId;
            newWebsite.Creation_Date = tag.Creation_Date;
            const insertWebsite = await queryRunner.manager.save(newWebsite);

            const newDomain = new Domain();
            newDomain.WebsiteId = insertWebsite.WebsiteId;
            newDomain.Url = website.Url;
            newDomain.Start_Date = website.Start_Date;
            newDomain.Active = 1;
            const insertDomain = await queryRunner.manager.save(newDomain);

            const pages = await queryRunner.manager.query(`SELECT dp.* FROM DomainPage as dp, Page as p WHERE dp.DomainId = ? AND p.PageId = dp.PageId AND p.Show_In LIKE "1_1"`, [website.DomainId]);

            for (const page of pages || []) {
              await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`, [insertDomain.DomainId, page.PageId]);
            }

            await queryRunner.manager.query(`INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`, [insertTag.TagId, insertWebsite.WebsiteId]);
          }
        }

        await queryRunner.commitTransaction();
      } else {
        hasError = true;
      }
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

  async update(tagId: number, name: string, observatory: number, defaultWebsites: number[], websites: number[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.update(Tag, { TagId: tagId }, { Name: name, Show_in_Observatorio: observatory});

      for (const id of defaultWebsites || []) {
        if (!websites.includes(id)) {
          await queryRunner.manager.query(`DELETE FROM TagWebsite WHERE TagId = ? AND WebsiteId = ?`, [tagId, id]);
        }
      }
  
      for (const id of websites || []) {
        if (!defaultWebsites.includes(id)) {
          await queryRunner.manager.query(`INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`, [tagId, id]);
        }
      }

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

  async delete(tagId: number): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.delete(Tag, { where: { TagId: tagId } });
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

  async removeUserTag(userId: number, tagsId: number[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const id of tagsId || []) {
        const relations = await queryRunner.manager.query(`SELECT * FROM TagWebsite WHERE TagId = ? AND WebsiteId <> -1`, [id]);
        if (relations.length > 0) {
          const websitesId = relations.map(tw => tw.WebsiteId);
          await queryRunner.manager.delete(Website, { WebsiteId: In(websitesId) });
        }
      }
      await queryRunner.manager.delete(Tag, { TagId: In(tagsId) });

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

  async findAllUserTagWebsites(tag: string, user: string): Promise<any> {
    const manager = getManager();

    if (user === 'admin') {
      const websites = await manager.query(`SELECT w.*, e.Short_Name as Entity, e.Long_Name as Entity2, u.Username as User 
        FROM 
          Website as w
          LEFT OUTER JOIN Entity as e ON e.EntityId = w.EntityId
          LEFT OUTER JOIN User as u ON u.UserId = w.UserId,
          Tag as t,
          TagWebsite as tw
        WHERE
          LOWER(t.Name) = ? AND
          t.UserId IS NULL AND
          tw.TagId = t.TagId AND
          w.WebsiteId = tw.WebsiteId
        GROUP BY w.WebsiteId`, [tag.toLowerCase()]);

      return websites;
    } else {
      const websites = await manager.query(`SELECT w.*, d.Url, e.Long_Name as Entity, u.Username as User 
      FROM 
        Website as w
        LEFT OUTER JOIN Entity as e ON e.EntityId = w.EntityId,
        User as u,
        Tag as t,
        TagWebsite as tw,
        Domain as d
      WHERE
        LOWER(t.Name) = ? AND
        u.Username = ? AND
        t.UserId = u.UserId AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND 
        d.WebsiteId = w.WebsiteId
      GROUP BY w.WebsiteId, d.Url`, [tag.toLowerCase(), user]);

      return websites;
    }
  }

  async verifyUpdateWebsiteAdmin(websiteId: number): Promise<any> {
    const manager = getManager();

    const studyP = await manager.query(`SELECT p.PageId
      FROM  
        Page as p, 
        Domain as d,
        DomainPage as dp,
        Website as w
      WHERE 
        w.WebsiteId = ? AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        dp.PageId = p.PageId AND
        p.Show_In LIKE '0%'`, [websiteId]);

    return studyP.length === 0;
  }

  async domainExistsInAdmin(websiteId: number): Promise<any> {
    const manager = getManager();

    const websites = await manager.query(`SELECT
        w2.*
      FROM
        Domain as d,
        Domain as d2,
        Website as w,
        Website as w2
      WHERE
        w.WebsiteId = ? AND
        d.WebsiteId = w.WebsiteId AND 
        d2.WebsiteId = w2.WebsiteId AND 
        d2.Url = d.Url AND
        d2.DomainId != d.DomainId`, [websiteId]);
    
        return websites;
  }

  async import(tagId: number, tagName: string): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const websites = await queryRunner.manager.query(`SELECT tw.*, w.Name FROM TagWebsite as tw, Website as w WHERE tw.TagId = ? AND w.WebsiteId = tw.WebsiteId`, [tagId]);
      
      if (websites.length > 0) {
        const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        const insertTag = await queryRunner.manager.query(`INSERT INTO Tag (Name, Show_in_Observatorio, Creation_Date) 
                    VALUES (?, "0", ?)`, [tagName, date]);

        for (const website of websites || []) {
          const websiteId = await this.importWebsite(queryRunner, website.WebsiteId, website.Name);
          await queryRunner.manager.query(`INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`, [insertTag.insertId, websiteId]);
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
      console.error(err);
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  private async importWebsite(queryRunner: any, websiteId: number, websiteName: string): Promise<any> {
    let returnWebsiteId = websiteId;
    
    const webDomain = await queryRunner.manager.query(`SELECT distinct w.*, d.*
      FROM 
        Page as p, 
        Domain as d, 
        Website as w,
        DomainPage as dp 
      WHERE 
        w.WebsiteId = ? AND
        d.WebsiteId = w.WebsiteId AND 
        d.Active = "1"`, [websiteId]);

    const domDate = webDomain[0].Start_Date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const webDate = webDomain[0].Creation_Date.toISOString().replace(/T/, ' ').replace(/\..+/, '');

    const pages = await queryRunner.manager.query(`SELECT p.*
      FROM 
        Page as p, 
        Domain as d, 
        Website as w,
        DomainPage as dp 
      WHERE 
        w.WebsiteId = ? AND
        d.WebsiteId = w.WebsiteId AND 
        dp.domainId = d.DomainId AND
        dp.PageId = p.PageId`, [websiteId]);

    const domainP = (await queryRunner.manager.query(`SELECT distinct d.DomainId, w.*
      FROM  
        Domain as d,
        Website as w,
        User as u
      WHERE 
        d.Url = ? AND
        w.WebsiteId = d.WebsiteId AND
        (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type = "monitor"))
      LIMIT 1
      `, [webDomain[0].Url]))[0]; 

    const domainUrl = webDomain[0].Url;

    if (webDomain.length > 0) {
      if (domainP) {
        for (const page of pages || []) {
          if (page.Show_In[0] === '0') {
            await this.importPage(queryRunner, page.PageId);
            try {
              await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`, [domainP.DomainId, page.PageId]);
            } catch(err) {
              // ignore - don't know why
            }
          }
        }
        if (domainP.Deleted === 1) {
          await queryRunner.manager.query(`UPDATE Website SET Name = ?, Creation_Date = ?, Deleted = "0" WHERE WebsiteId = ?`, [websiteName || domainP.Name, webDate, domainP.WebsiteId]);
        } else {
          await queryRunner.manager.query(`UPDATE Website SET Creation_Date = ? WHERE WebsiteId = ?`, [webDate, domainP.DomainId]);
        }
      } else {
        const insertWebsite = await queryRunner.manager.query(`INSERT INTO Website (Name, Creation_Date) VALUES (?, ?)`, [websiteName, webDate]);
        returnWebsiteId = insertWebsite.insertId;

        const domain = await queryRunner.manager.query(`INSERT INTO Domain ( WebsiteId,Url, Start_Date, Active) VALUES (?, ?, ?, "1")`, [insertWebsite.websiteId, domainUrl, domDate]);

        for (const page of pages || []) {
          if (page.Show_In[0] === '0') {
            await this.importPage(queryRunner, page.PageId);
            await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES ("${domain.insertId}", "${page.PageId}")`, [domain.DomainId, page.PageId]);
          }
        }
      }
    }

    return returnWebsiteId;
  }

  private async importPage(queryRunner: any, pageId: number): Promise<any> {
    const page = await queryRunner.manager.query(`SELECT Show_In FROM Page WHERE PageId = ? LIMIT 1`, [pageId]);

    if (page.length > 0) {
      const show = "1" + page[0].Show_In[1] + page[0].Show_In[2];
      await queryRunner.manager.query(`UPDATE Page SET Show_In = ? WHERE PageId = ?`, [show, pageId]);

      const evaluation = await queryRunner.manager.query(`SELECT  e.EvaluationId, e.Show_To FROM Evaluation as e WHERE e.PageId = ? AND e.Show_To LIKE "_1" ORDER BY e.Evaluation_Date  DESC LIMIT 1`, [pageId]);

      const evalId = evaluation[0].EvaluationId;
      const showTo = evaluation[0].Show_To;

      if (evaluation.length > 0) {
        const newShowTo = "1" + showTo[1];
        await queryRunner.manager.query(`UPDATE Evaluation SET Show_To = ? WHERE EvaluationId = ?`, [newShowTo, evalId]);
      }
    }
  }
}
