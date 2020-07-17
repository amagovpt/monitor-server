import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, getManager, Like } from 'typeorm';
import { Website } from '../website/website.entity';
import { Page } from './page.entity';
import { Evaluation } from '../evaluation/evaluation.entity';

@Injectable()
export class PageService {

  constructor(
    @InjectRepository(Website)
    private readonly websiteRepository: Repository<Website>,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    private readonly connection: Connection
  ) {}

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

  async findAllInEvaluationList(): Promise<number> {
    const manager = getManager();
    const result = await manager.query('SELECT COUNT(*) as Total FROM Evaluation_List WHERE UserId IS NULL AND Error IS NULL');
    return result[0].Total;
  }

  async findAll(): Promise<any> {
    const manager = getManager();
    const pages = await manager.query(`SELECT p.*, e.Score, e.Evaluation_Date, el.EvaluationListId, el.Error, el.Is_Evaluating 
      FROM 
        Page as p
        LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Evaluation_Date = (
          SELECT Evaluation_Date FROM Evaluation 
          WHERE PageId = p.PageId
          ORDER BY Evaluation_Date DESC LIMIT 1
        )
        LEFT OUTER JOIN Evaluation_List as el ON el.PageId = p.PageId AND el.UserId = -1
      WHERE
        LOWER(p.Show_In) LIKE '1%'
      GROUP BY p.PageId, e.Score, e.Evaluation_Date, el.EvaluationListId, el.Error, el.Is_Evaluating`);
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
      e.Tot,
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

  async findStudyMonitorUserTagWebsitePages(userId: number, tag: string, website: string): Promise<any> {
    const manager = getManager();
    const websiteExists = await manager.query(`SELECT * FROM Website WHERE UserId = ? AND LOWER(Name) = ? LIMIT 1`, [userId, website.toLowerCase()]);
    
    if (!websiteExists) {
      throw new InternalServerErrorException();
    }

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
        e.StudyUserId = w.UserId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId);`, [tag.toLowerCase(), userId, website.toLowerCase(), userId]);
  
    return pages;
  }

  async findPageFromUrl(url: string): Promise<any> {
    return this.pageRepository.findOne({ where: { Uri: url } });
  }

  async isPageFromStudyMonitorUser(userId: number, tag: string, website: string, pageId: number): Promise<any> {
    const manager = getManager();
    const pages = await manager.query(`SELECT p.* FROM
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d,
        DomainPage as dp,
        Page as p
      WHERE
        t.Name = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.Name = ? AND
        w.UserId = ? AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        dp.PageId = p.PageId AND
        p.PageId = ?
      `, [tag, userId, website, userId, pageId]);

    return pages.length > 0;
  }

  async isPageFromMyMonitorUser(userId: number, pageId: number): Promise<any> {
    const manager = getManager();
    const pages = await manager.query(`SELECT p.* FROM
        Website as w,
        Domain as d,
        DomainPage as dp,
        Page as p
      WHERE
        w.UserId = ? AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        dp.PageId = p.PageId AND
        p.PageId = ?
      `, [userId, pageId]);

    return pages.length > 0;
  }

  async addPageToEvaluate(url: string, showTo: string = '10', userId: number | null = null, studyUserId: number | null = null): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const page = await queryRunner.manager.findOne(Page, { where: { Uri: url }});

      await queryRunner.manager.query(`INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date, StudyUserId) VALUES (?, ?, ?, ?, ?, ?)`, [page.PageId, userId, page.Uri, showTo, new Date(), studyUserId]);

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

    return !hasError;
  }

  async addPages(domainId: number, uris: string[], observatory: string[]): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const uri of uris || []) {
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

          const newPage = new Page();
          newPage.Uri = uri;
          newPage.Show_In = showIn;
          newPage.Creation_Date = new Date();

          const insertPage = await queryRunner.manager.save(newPage);
          await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`, [domainId, insertPage.PageId]);

          await queryRunner.manager.query(`INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date) VALUES (?, ?, ?, ?, ?)`, [insertPage.PageId, -1, uri, '10', newPage.Creation_Date]);
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

    return !hasError;
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
          const newPage = new Page();
          newPage.Uri = uri;
          newPage.Show_In = '010';
          newPage.Creation_Date = new Date();

          const insertPage = await queryRunner.manager.save(newPage);

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

          await queryRunner.manager.query(`INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date) VALUES (?, ?, ?, ?, ?)`, [insertPage.PageId, userId, insertPage.Uri, '01', insertPage.Creation_Date]);
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

    return !hasError;
    //return await this.findAllFromMyMonitorUserWebsite(userId, website);
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
    return this.findAllFromMyMonitorUserWebsite(userId, website);
  }

  async createStudyMonitorUserTagWebsitePages(userId: number, tag: string, website: string, domain: string, uris: string[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const uri of uris || []) {
        const pageExists = await queryRunner.manager.findOne(Page, { Uri: uri }, { select: ['PageId', 'Uri', 'Creation_Date'] });
        if (pageExists) {
          const domainPage = await queryRunner.manager.query(`SELECT 
              dp.* 
            FROM
              Tag as t,
              TagWebsite as tw,
              Website as w,
              Domain as d,
              DomainPage as dp
            WHERE 
              LOWER(t.Name) = ? AND
              t.UserId = ? AND 
              tw.TagId = t.TagId AND
              w.WebsiteId = tw.WebsiteId AND
              LOWER(w.Name) = ? AND
              w.UserId = ? AND
              d.WebsiteId = w.WebsiteId AND
              dp.DomainId = d.DomainId AND
              dp.PageId = ?`, [tag.toLowerCase(), userId, website.toLowerCase(), userId, pageExists.PageId]);

          if (domainPage.length === 0) {
            await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) 
              SELECT 
                d.DomainId, 
                ? 
              FROM
                Tag as t,
                TagWebsite as tw,
                Website as w,
                Domain as d
              WHERE 
                LOWER(t.Name) = ? AND
                t.UserId = ? AND 
                tw.TagId = t.TagId AND
                w.WebsiteId = tw.WebsiteId AND
                LOWER(w.Name) = ? AND
                w.UserId = ? AND
                d.WebsiteId = w.WebsiteId`, [pageExists.PageId, tag.toLowerCase(), userId, website.toLowerCase(), userId]);
          }
          
          await queryRunner.manager.query(`INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date, StudyUserId) VALUES (?, ?, ?, ?, ?, ?)`, [pageExists.PageId, userId, pageExists.Uri, '00', pageExists.Creation_Date, userId]);
        } else {
          const newPage = new Page();
          newPage.Uri = uri;
          newPage.Show_In = '000';
          newPage.Creation_Date = new Date();

          const insertPage = await queryRunner.manager.save(newPage);

          await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) 
            SELECT 
              d.DomainId, 
              ? 
            FROM
              Tag as t,
              TagWebsite as tw,
              Website as w,
              Domain as d
            WHERE 
              LOWER(t.Name) = ? AND
              t.UserId = ? AND 
              tw.TagId = t.TagId AND
              w.WebsiteId = tw.WebsiteId AND
              LOWER(w.Name) = ? AND
              w.UserId = ? AND
              d.WebsiteId = w.WebsiteId`, [insertPage.PageId, tag.toLowerCase(), userId, website.toLowerCase(), userId]);

          const existingDomain = await queryRunner.manager.query(`SELECT distinct d.DomainId, d.Url 
            FROM
              User as u,
              Website as w,
              Domain as d
            WHERE
              LOWER(d.Url) = ? AND
              d.WebsiteId = w.WebsiteId AND
              (
                w.UserId IS NULL OR
                (
                  u.UserId = w.UserId AND
                  LOWER(u.Type) = 'monitor'
                )
              )
            LIMIT 1`, [domain.toLowerCase()]);

          if (existingDomain.length > 0) {
            await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`, [existingDomain[0].DomainId, insertPage.PageId]);
          }

          await queryRunner.manager.query(`INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date, StudyUserId) VALUES (?, ?, ?, ?, ?, ?)`, [insertPage.PageId, userId, insertPage.Uri, '00', insertPage.Creation_Date, userId]);
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

    return !hasError;
    //return this.findStudyMonitorUserTagWebsitePages(userId, tag, website);
  }

  async removeStudyMonitorUserTagWebsitePages(userId: number, tag: string, website: string, pagesId: number[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.query(`
        DELETE 
          dp.* 
        FROM
          Tag as t,
          TagWebsite as tw,
          Domain as d,
          DomainPage as dp
        WHERE 
          LOWER(t.Name) = ? AND
          t.UserId = ? AND
          tw.TagId = t.TagId AND
          d.WebsiteId = tw.WebsiteId AND
          dp.DomainId = d.DomainId AND
          dp.PageId IN (?)`, [tag.toLowerCase(), userId, pagesId]);

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
    return this.findStudyMonitorUserTagWebsitePages(userId, tag, website);
  }

  async update(pageId: number, checked: boolean): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const page = await queryRunner.manager.findOne(Page, { where: { PageId: pageId } });

      if (page) {
        const both = new RegExp('[0-1][1][1]');
        const none = new RegExp('[0-1][0][0]');
        let show = null;

        if (both.test(page.Show_In)) {
          show = page.Show_In[0] + "10";
        } else if (page.Show_In[1] === '1' && checked) {
          show = page.Show_In[0] + "11";
        } else if (page.Show_In[1] === '1' && !checked) {
          show = page.Show_In[0] + "00";
        } else if (page.Show_In[2] === '1' && checked) {
          show = page.Show_In[0] + "11";
        } else if (page.Show_In[2] === '1' && !checked) {
          show = page.Show_In[0] + "00";
        } else if (none.test(page.Show_In)) {
          show = page.Show_In[0] + "01";
        }

        await queryRunner.manager.update(Page, { PageId: pageId }, { Show_In: show });
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

    return pageId;
  }

  async delete(pages: number[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const id of pages || []) {
        const page = await queryRunner.manager.findOne(Page, { where: { PageId: id } });

        if (page) {
          const show_in = page.Show_In;
          let new_show_in = '000';
          if (show_in[1] === '1') {
            new_show_in = '010';
          }
          await queryRunner.manager.update(Page, { PageId: id }, { Show_In: new_show_in });
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

    return !hasError;
  }

  async import(pageId: number, type: string): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const page = await queryRunner.manager.query(`SELECT Show_In FROM Page WHERE PageId = ? LIMIT 1`, [pageId]);

      if (page.length > 0) {
        const show = "1" + page[0].Show_In[1] + page[0].Show_In[2];
        await queryRunner.manager.query(`UPDATE Page SET Show_In = ? WHERE PageId = ?`, [show, pageId]);

        let query: string;
        if (type === 'studies') {
          query = `SELECT  e.EvaluationId, e.Show_To FROM Evaluation as e WHERE e.PageId = ? ORDER BY e.Evaluation_Date  DESC LIMIT 1`;
        } else {
          query = `SELECT e.EvaluationId, e.Show_To FROM Evaluation as e WHERE e.PageId = ? AND e.Show_To LIKE "_1" ORDER BY e.Evaluation_Date  DESC LIMIT 1`;
        }

        const evaluation = await queryRunner.manager.query(query, [pageId]);

        const evalId = evaluation[0].EvaluationId;
        const showTo = evaluation[0].Show_To;

        if (evaluation.length > 0) {
          const newShowTo = "1" + showTo[1];
          await queryRunner.manager.query(`UPDATE Evaluation SET Show_To = ? WHERE EvaluationId = ?`, [newShowTo, evalId]);
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
    
    return !hasError;
  }

  async importStudy(pageId: number, username: string, tagName: string, website: string): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const tag = await queryRunner.manager.query(`SELECT w.*, d.*
        FROM
          User as u,
          Tag as t, 
          Page as p, 
          Domain as d, 
          Website as w,
          TagWebsite as tw,
          DomainPage as dp 
        WHERE
          p.PageId = ?  AND 
          dp.PageId = p.PageId AND
          dp.DomainId = d.DomainId AND
          d.WebsiteId = w.WebsiteId AND
          w.Name = ? AND
          tw.WebsiteId = w.WebsiteId AND 
          t.TagId = tw.TagId AND
          t.Name = ? AND
          u.UserId = t.UserId AND
          u.Username = ?`, [pageId, website, tagName, username]);

      const domDate = tag[0].Start_Date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
      const webDate = tag[0].Creation_Date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
  
      const websiteName = tag[0].Name;
      const domainUrl = tag[0].Url;
      
      const domainP = await queryRunner.manager.query(`
        SELECT d.DomainId, w.Deleted, w.WebsiteId
        FROM
          User as u,
          Website as w,
          Domain as d
        WHERE
          d.Url = ? AND
          w.WebsiteId = d.WebsiteId AND
          (
            w.UserId IS NULL OR
            (
              u.UserId = w.UserId AND
              LOWER(u.Type) = 'monitor'
            )
          )
        LIMIT 1
      `, [domainUrl]);

      const domainPageExists = await queryRunner.manager.query(`SELECT dp.*
        FROM 
          DomainPage as dp
        WHERE
          dp.DomainId = ? AND
          dp.PageId = ?`, [domainP[0].DomainId, pageId]);

      if (tag.length > 0) {
        if (domainP.length > 0) {
          if (domainPageExists.length <= 0) {
            await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`, [domainP[0].DomainId, pageId]);
          }
  
          if (domainP[0].Deleted === 1) {
            await queryRunner.manager.query(`UPDATE Website SET Name = ?, Deleted = 0 WHERE WebsiteId = ?`, [website, domainP[0].WebsiteId]);
          }
        } else {
          const insertWebsite = await queryRunner.manager.query(`INSERT INTO Website (Name, Creation_Date) VALUES (?, ?)`, [websiteName, webDate]);
  
          const insertDomain = await queryRunner.manager.query(`INSERT INTO Domain ( WebsiteId, Url, Start_Date, Active) VALUES (?, ?, ?, "1")`, [insertWebsite.WebsiteId, domainUrl, domDate]);
  
          await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`, [insertDomain.DomainId, pageId]);
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
    
    return !hasError;
  }
}