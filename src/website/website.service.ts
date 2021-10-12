import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository, getManager, IsNull, Like } from "typeorm";
import { Website } from "./website.entity";
import { Domain } from "../domain/domain.entity";
import { Tag } from "../tag/tag.entity";
import { Page } from "../page/page.entity";
import { EvaluationService } from "../evaluation/evaluation.service";

@Injectable()
export class WebsiteService {
  constructor(
    @InjectRepository(Website)
    private readonly websiteRepository: Repository<Website>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Domain)
    private readonly domainRepository: Repository<Domain>,
    private readonly connection: Connection
  ) {}

  async addPagesToEvaluate(
    domainsId: number[],
    option: string
  ): Promise<boolean> {
    const pages = await this.websiteRepository.query(
      `
      SELECT 
        p.PageId, 
        p.Uri 
      FROM 
        DomainPage as dp, 
        Page as p
      WHERE
        dp.DomainId IN (?) AND
        p.PageId = dp.PageId AND
        p.Show_In LIKE ?`,
      [domainsId, option === "all" ? "1__" : "1_1"]
    );

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    let error = false;
    try {
      for (const page of pages || []) {
        try {
          const pageEval = await queryRunner.manager.query(
            `SELECT * FROM Evaluation_List WHERE PageId = ? AND UserId = -1 AND Url = ? AND Show_To = ? LIMIT 1`,
            [page.PageId, page.Uri, "10"]
          );
          if (pageEval.length > 0) {
            await queryRunner.manager.query(
              `UPDATE Evaluation_List SET Error = NULL, Is_Evaluating = 0 WHERE EvaluationListId = ?`,
              [pageEval[0].EvaluationListId]
            );
          } else {
            await queryRunner.manager.query(
              `INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date) VALUES (?, ?, ?, ?, ?)`,
              [page.PageId, -1, page.Uri, "10", new Date()]
            );
          }
        } catch (_) {}
      }

      await queryRunner.manager.query(
        `UPDATE Evaluation_Request_Counter SET Counter = Counter + ?, Last_Request = NOW() WHERE Application = "AMS/Observatory"`,
        [pages.length]
      );

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

  async adminCount(search: string): Promise<any> {
    const manager = getManager();
    const count = await manager.query(
      `SELECT COUNT(w.WebsiteId) as Count
      FROM 
        Website as w
        LEFT OUTER JOIN User as u ON u.UserId = w.UserId
      WHERE
        w.Name LIKE ? AND
        (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies')) AND
        w.Deleted = "0"`,
      [search.trim() !== "" ? `%${search.trim()}%` : "%"]
    );

    return count[0].Count;
  }

  async findAll(
    size: number,
    page: number,
    sort: string,
    direction: string,
    search: string
  ): Promise<any> {
    if (!direction.trim()) {
      const manager = getManager();
      const websites = await manager.query(
        `
        SELECT 
          w.*, 
          u.Username as User, u.Type as Type, 
          d.DomainId, d.Url as Domain, 
          COUNT(distinct p.PageId) as Pages,
          COUNT(distinct e.PageId) as Evaluated_Pages
        FROM 
          Website as w
          LEFT OUTER JOIN User as u ON u.UserId = w.UserId
          LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = "1"
          LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
          LEFT OUTER JOIN Page as p ON p.PageId = dp.PageId AND p.Show_In LIKE "1__"
          LEFT OUTER JOIN Evaluation as e ON e.PageId = p.PageId
        WHERE
          (w.Name LIKE ? OR d.Url LIKE ?) AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies')) AND
          w.Deleted = "0"
        GROUP BY w.WebsiteId, d.DomainId
        LIMIT ? OFFSET ?`,
        [
          search.trim() !== "" ? `%${search.trim()}%` : "%",
          search.trim() !== "" ? `%${search.trim()}%` : "%",
          size,
          page * size,
        ]
      );

      /* 
        LEFT OUTER JOIN Evaluation as e2 ON e.PageId = p.PageId AND e2.Evaluation_Date = (
            SELECT Evaluation_Date FROM Evaluation 
            WHERE PageId = p.PageId
            ORDER BY Evaluation_Date DESC LIMIT 1
          )
      */
      return websites;
    } else {
      let order = "";
      switch (sort) {
        case "Name":
          order = "w.Name";
          break;
        case "Pages":
          order = "Pages";
          break;
        case "Creation_Date":
          order = "w.Creation_Date";
          break;
      }

      const manager = getManager();
      const websites = await manager.query(
        `
        SELECT 
          w.*, 
          u.Username as User, u.Type as Type, 
          d.DomainId, d.Url as Domain, 
          COUNT(distinct p.PageId) as Pages,
          COUNT(distinct e.PageId) as Evaluated_Pages
        FROM 
          Website as w
          LEFT OUTER JOIN User as u ON u.UserId = w.UserId
          LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = "1"
          LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
          LEFT OUTER JOIN Page as p ON p.PageId = dp.PageId AND p.Show_In LIKE "1__"
          LEFT OUTER JOIN Evaluation as e ON e.PageId = p.PageId
        WHERE
          (w.Name LIKE ? OR d.Url LIKE ?) AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies')) AND
          w.Deleted = "0"
        GROUP BY w.WebsiteId, d.DomainId
        ORDER BY ${order} ${direction.toUpperCase()}
        LIMIT ? OFFSET ?`,
        [
          search.trim() !== "" ? `%${search.trim()}%` : "%",
          search.trim() !== "" ? `%${search.trim()}%` : "%",
          size,
          page * size,
        ]
      );
      return websites;
    }
  }

  async findInfo(websiteId: number): Promise<any> {
    const websites = await this.websiteRepository.query(
      `SELECT w.*, u.Username as User, e.Long_Name as Entity, d.Url as Domain
      FROM 
        Website as w
        LEFT OUTER JOIN User as u ON u.UserId = w.UserId
        LEFT OUTER JOIN Entity as e ON e.EntityId = w.EntityId
        LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
      WHERE 
        w.WebsiteId = ?
      GROUP BY w.WebsiteId, d.Url 
      LIMIT 1`,
      [websiteId]
    );

    if (websites) {
      const website = websites[0];

      website.tags = await this.websiteRepository.query(
        `SELECT t.* FROM Tag as t, TagWebsite as tw WHERE tw.WebsiteId = ? AND t.TagId = tw.TagId`,
        [websiteId]
      );

      website.entities = await this.websiteRepository.query(
        `SELECT e.* FROM Entity as e, EntityWebsite as ew WHERE ew.WebsiteId = ? AND e.EntityId = ew.EntityId`,
        [websiteId]
      );
      return website;
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findUserType(username: string): Promise<any> {
    if (username === "admin") {
      return "nimda";
    }

    const user = await getManager().query(
      `SELECT * FROM User WHERE Username = ? LIMIT 1`,
      [username]
    );

    if (user) {
      return user[0].Type;
    } else {
      return null;
    }
  }

  async findAllDomains(
    user: string,
    type: string,
    website: string,
    flags: string
  ): Promise<void> {
    const manager = getManager();

    if (type === "nimda") {
      const domains = await manager.query(
        `SELECT
          d.*,
          COUNT(distinct p.PageId) as Pages,
          COUNT(distinct e.PageId) as Evaluated_Pages,
          u2.Username as User
        FROM
          Domain as d
          LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
          LEFT OUTER JOIN Website as w2 ON w2.WebsiteId = d.WebsiteId
          LEFT OUTER JOIN User as u2 ON u2.UserId = w2.UserId
          LEFT OUTER JOIN Page as p ON p.PageId = dp.PageId AND p.Show_In LIKE "1__"
          LEFT OUTER JOIN Evaluation as e ON e.PageId = p.PageId,
          Website as w,
          User as u
        WHERE
          w.WebsiteId = d.WebsiteId AND
          w.Name = ? AND
          (
            w.UserId IS NULL OR
            (
              u.UserId = w.UserId AND
              u.Type != 'studies'
            )
          )
        GROUP BY d.DomainId`,
        [website]
      );

      return domains;
    } else {
      const domains = await manager.query(
        `SELECT d.*, SUM(CASE WHEN(p.Show_In LIKE ?) THEN 1 ELSE 0 END) as Pages, u.Username as User
        FROM
          Domain as d
          LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
          LEFT OUTER JOIN Page as p ON p.PageId = dp.PageId,
          User as u,
          Website as w
        WHERE
          u.Username = ? AND
          w.UserId = u.UserId AND
          w.Name = ? AND
          d.WebsiteId = w.WebsiteId
        GROUP BY d.DomainId`,
        [flags, user, website]
      );

      return domains;
    }
  }

  async findAllPages(websiteId: number): Promise<any> {
    const manager = getManager();

    const pages = await manager.query(
      `SELECT p.PageId, p.Uri, p.Show_In
      FROM
        Domain as d,
        DomainPage as dp,
        Page as p
      WHERE
        d.WebsiteId = ? AND
        d.Active = "1" AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        p.Show_In LIKE "1__"`,
      [websiteId]
    );

    return pages;
  }

  async findAllOfficial(): Promise<any> {
    const manager = getManager();
    const websites = await manager.query(`SELECT distinct w.* 
      FROM 
        Website as w, 
        User as u 
      WHERE 
        (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies')) AND
        w.Deleted = "0"`);
    return websites;
  }

  async findByOfficialName(name: string): Promise<any> {
    const website = await this.websiteRepository.findOne({
      where: { Name: name, UserId: IsNull(), Deleted: 0 },
    });
    return website;
    /*if (website && website.Name !== name) {
      return undefined;
    } else {
      return website;
    }*/
  }

  async findAllWithoutUser(): Promise<any> {
    const manager = getManager();
    const websites = await manager.query(
      `SELECT * FROM Website WHERE UserId IS NULL AND Deleted = "0"`
    );
    return websites;
  }

  async findAllWithoutEntity(): Promise<any> {
    const manager = getManager();
    const websites = await manager.query(`SELECT distinct w.* 
      FROM 
        Website as w, 
        User as u 
      WHERE 
        w.EntityId IS NULL AND
        w.Deleted = "0" AND
        (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))`);
    return websites;
  }

  async findAllFromMyMonitorUser(userId: number): Promise<any> {
    const manager = getManager();
    const websites = await manager.query(
      `SELECT w.*, d.Url as Domain, COUNT(distinct p.PageId) as Pages
      FROM
        Website as w
        LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
        LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
        LEFT OUTER JOIN Page as p ON p.PageId = dp.PageId AND p.Show_In LIKE '_1%'
      WHERE
        w.UserId = ?
      GROUP BY w.WebsiteId, d.Url`,
      [userId]
    );
    return websites;
  }

  async isInObservatory(userId: number, website: string): Promise<any> {
    const manager = getManager();

    const tags = await manager.query(
      `
      SELECT t.* 
      FROM
        Directory as d,
        DirectoryTag as dt,
        Tag as t,
        TagWebsite as tw,
        Website as w
      WHERE
        w.UserId = ? AND
        w.Name = ? AND
        tw.WebsiteId = w.WebsiteId AND
        t.TagId = tw.TagId AND
        t.UserId IS NULL AND
        dt.TagId = t.TagId AND
        d.DirectoryId = dt.DirectoryId AND
        d.Show_In_Observatory = 1
    `,
      [userId, website]
    );

    return tags.length > 0;
  }

  async transferObservatoryPages(
    userId: number,
    website: string
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    let error = false;
    try {
      const pages = await queryRunner.manager.query(
        `
        SELECT
          p.* 
        FROM
          Directory as dir,
          DirectoryTag as dt,
          Tag as t,
          TagWebsite as tw,
          Website as w,
          Domain as d,
          DomainPage as dp,
          Page as p
        WHERE
          w.UserId = ? AND
          w.Name = ? AND
          tw.WebsiteId = w.WebsiteId AND
          t.TagId = tw.TagId AND
          t.UserId IS NULL AND
          dt.TagId = t.TagId AND
          dir.DirectoryId = dt.DirectoryId AND
          dir.Show_In_Observatory = 1 AND
          d.WebsiteId = w.WebsiteId AND
          dp.DomainId = d.DomainId AND
          p.PageId = dp.PageId and
          p.Show_In LIKE "_01"
      `,
        [userId, website]
      );

      for (const page of pages || []) {
        const evaluation = await queryRunner.manager.query(
          `
          SELECT * 
          FROM 
            Evaluation 
          WHERE 
            PageId = ? AND
            Show_To LIKE "1_"
          ORDER BY Evaluation_Date DESC LIMIT 1
        `,
          [page.PageId]
        );
        if (evaluation.length > 0) {
          await queryRunner.manager.query(
            `UPDATE Page SET Show_In = ? WHERE PageId = ?`,
            [page.Show_In[0] + "1" + page.Show_In[2], page.PageId]
          );
          await queryRunner.manager.query(
            `UPDATE Evaluation SET Show_To = ? WHERE EvaluationId = ?`,
            [evaluation[0].Show_To[0] + "1", evaluation[0].EvaluationId]
          );
        }
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

  async reEvaluateMyMonitorWebsite(
    userId: number,
    websiteName: string
  ): Promise<any> {
    const website = await this.websiteRepository.findOne({
      where: { UserId: userId, Name: websiteName },
    });
    if (!website) {
      throw new InternalServerErrorException();
    }

    const manager = getManager();

    const pages = await manager.query(
      `SELECT 
        distinct p.*
      FROM 
        Page as p,
        Website as w,
        Domain as d,
        DomainPage as dp
      WHERE
        w.Name = ? AND
        w.UserId = ? AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        p.Show_In LIKE '_1_'`,
      [website.Name, website.UserId]
    );

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    let error = false;
    try {
      for (const page of pages || []) {
        try {
          await queryRunner.manager.query(
            `INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date) VALUES (?, ?, ?, ?, ?)`,
            [page.PageId, userId, page.Uri, "01", new Date()]
          );
        } catch (_) {}
      }

      await queryRunner.manager.query(
        `UPDATE Evaluation_Request_Counter SET Counter = Counter + ?, Last_Request = NOW() WHERE Application = "MyMonitor"`,
        [pages.length]
      );

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

  async reEvaluateStudyMonitorWebsite(
    userId: number,
    tag: string,
    website: string
  ): Promise<boolean> {
    const manager = getManager();
    const websiteExists = await manager.query(
      `SELECT * FROM Website WHERE UserId = ? AND Name = ? LIMIT 1`,
      [userId, website]
    );

    if (!websiteExists) {
      throw new InternalServerErrorException();
    }

    const pages = await manager.query(
      `SELECT 
        distinct p.*
      FROM 
        Page as p,
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d,
        DomainPage as dp
      WHERE
        t.Name = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.Name = ? AND
        w.UserId = ? AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId`,
      [tag, userId, website, userId]
    );

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    let error = false;
    try {
      for (const page of pages || []) {
        try {
          await queryRunner.manager.query(
            `INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date, StudyUserId) VALUES (?, ?, ?, ?, ?, ?)`,
            [page.PageId, userId, page.Uri, "00", new Date(), userId]
          );
        } catch (_) {}
      }

      await queryRunner.manager.query(
        `UPDATE Evaluation_Request_Counter SET Counter = Counter + ?, Last_Request = NOW() WHERE Application = "StudyMonitor"`,
        [pages.length]
      );

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

  async findAllFromStudyMonitorUserTag(
    userId: number,
    tagName: string
  ): Promise<any> {
    const tag = await this.tagRepository.findOne({
      where: { UserId: userId, Name: tagName },
    });
    if (tag) {
      return await this.websiteRepository.query(
        `SELECT 
          w.WebsiteId,
          w.Name,
          d.Url,
          COUNT(distinct p.PageId) as Pages,
          AVG(e.Score) as Score
        FROM
          Tag as t,
          TagWebsite as tw,
          Website as w,
          Domain as d
          LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
          LEFT OUTER JOIN Page as p ON p.PageId = dp.PageId
          LEFT OUTER JOIN Evaluation as e ON e.StudyUserId = ? AND e.Evaluation_Date IN (
            SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId AND StudyUserId = e.StudyUserId
          )
        WHERE
          t.Name = ? AND
          t.UserId = ? AND
          tw.TagId = t.TagId AND
          w.WebsiteId = tw.WebsiteId AND
          w.UserId = ? AND
          d.WebsiteId = w.WebsiteId
        GROUP BY w.WebsiteId, d.Url`,
        [userId, tagName, userId, userId]
      );
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findAllFromStudyMonitorUserOtherTagsWebsites(
    userId: number,
    tagName: string
  ): Promise<any> {
    const manager = getManager();
    const websites = await manager.query(
      `SELECT
        distinct w.*,
        d.Url,
        t.Name as TagName
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d
      WHERE
        t.Name != ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = ? AND
        w.Name NOT IN (
          SELECT 
            w2.Name 
          FROM
            Tag as t2,
            TagWebsite as tw2,
            Website as w2
          WHERE
            t2.Name = ? AND
            t2.UserId = ? AND
            tw2.TagId = t2.TagId AND
            w2.WebsiteId = tw2.WebsiteId AND
            w2.UserId = ?
        ) AND
        d.WebsiteId = w.WebsiteId AND
        d.Url NOT IN (
          SELECT 
            d2.Url 
          FROM
            Tag as t2,
            TagWebsite as tw2,
            Website as w2,
            Domain as d2
          WHERE
            t2.Name = ? AND
            t2.UserId = ? AND
            tw2.TagId = t2.TagId AND
            w2.WebsiteId = tw2.WebsiteId AND
            w2.UserId = ? AND
            d2.WebsiteId = w2.WebsiteId
        )`,
      [
        tagName,
        userId,
        userId,
        tagName,
        userId,
        userId,
        tagName,
        userId,
        userId,
      ]
    );

    return websites;
  }

  async findStudyMonitorUserTagWebsiteByName(
    userId: number,
    tag: string,
    websiteName: string
  ): Promise<any> {
    const manager = getManager();
    const website = await manager.query(
      `SELECT * FROM 
        Tag as t,
        TagWebsite as tw,
        Website as w
      WHERE
        t.Name = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = ? AND
        w.Name = ?
      LIMIT 1`,
      [tag, userId, userId, websiteName]
    );

    return website[0];
  }

  async findStudyMonitorUserTagWebsiteByDomain(
    userId: number,
    tag: string,
    domain: string
  ): Promise<any> {
    const manager = getManager();
    const website = await manager.query(
      `SELECT * FROM 
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d
      WHERE
        t.Name = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = ? AND
        d.DomainId = w.WebsiteId AND
        d.Url = ?
      LIMIT 1`,
      [tag, userId, userId, domain]
    );

    return website[0];
  }

  async linkStudyMonitorUserTagWebsite(
    userId: number,
    tag: string,
    websitesId: number[]
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const id of websitesId || []) {
        await queryRunner.manager.query(
          `INSERT INTO TagWebsite (TagId, WebsiteId) 
          SELECT TagId, ? FROM Tag WHERE Name = ? AND UserId = ?`,
          [id, tag, userId]
        );
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

  async createStudyMonitorUserTagWebsite(
    userId: number,
    tag: string,
    websiteName: string,
    domain: string,
    pages: string[]
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const newWebsite = new Website();
      newWebsite.UserId = userId;
      newWebsite.Name = websiteName;
      newWebsite.Creation_Date = new Date();

      const insertWebsite = await queryRunner.manager.save(newWebsite);

      await queryRunner.manager.query(
        `INSERT INTO TagWebsite (TagId, WebsiteId) SELECT TagId, ? FROM Tag WHERE Name = ?`,
        [insertWebsite.WebsiteId, tag]
      );

      const newDomain = new Domain();
      newDomain.WebsiteId = insertWebsite.WebsiteId;
      newDomain.Url = domain;
      newDomain.Start_Date = insertWebsite.Creation_Date;
      newDomain.Active = 1;

      const insertDomain = await queryRunner.manager.save(newDomain);

      for (const url of pages || []) {
        const page = await queryRunner.manager.findOne(Page, {
          where: { Uri: url },
        });
        if (page) {
          await queryRunner.manager.query(
            `INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`,
            [insertDomain.DomainId, page.PageId]
          );
          await queryRunner.manager.query(
            `INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date, StudyUserId) VALUES (?, ?, ?, ?, ?, ?)`,
            [page.PageId, userId, page.Uri, "00", page.Creation_Date, userId]
          );
        } else {
          //const evaluation = await this.evaluationService.evaluateUrl(url);

          const newPage = new Page();
          newPage.Uri = url;
          newPage.Show_In = "000";
          newPage.Creation_Date = newWebsite.Creation_Date;

          const insertPage = await queryRunner.manager.save(newPage);

          //await this.evaluationService.savePageEvaluation(queryRunner, insertPage.PageId, evaluation, '01');

          await queryRunner.manager.query(
            `INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`,
            [insertDomain.DomainId, insertPage.PageId]
          );

          const existingDomain = await queryRunner.manager.query(
            `SELECT distinct d.DomainId, d.Url 
            FROM
              User as u,
              Website as w,
              Domain as d
            WHERE
              d.Url = ? AND
              d.WebsiteId = w.WebsiteId AND
              (
                w.UserId IS NULL OR
                (
                  u.UserId = w.UserId AND
                  u.Type = 'monitor'
                )
              )
            LIMIT 1`,
            [domain]
          );

          if (existingDomain.length > 0) {
            await queryRunner.manager.query(
              `INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`,
              [existingDomain[0].DomainId, newPage.PageId]
            );
          }

          await queryRunner.manager.query(
            `INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date) VALUES (?, ?, ?, ?, ?)`,
            [
              insertPage.PageId,
              userId,
              insertPage.Uri,
              "00",
              insertPage.Creation_Date,
            ]
          );
        }
      }

      await queryRunner.manager.query(
        `UPDATE Evaluation_Request_Counter SET Counter = Counter + ?, Last_Request = NOW() WHERE Application = "StudyMonitor"`,
        [pages.length]
      );

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

  async removeStudyMonitorUserTagWebsite(
    userId: number,
    tag: string,
    websitesId: number[]
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const id of websitesId || []) {
        const relations = await queryRunner.manager.query(
          `SELECT tw.* FROM TagWebsite as tw, Website as w
          WHERE 
            tw.WebsiteId = ? AND 
            tw.TagId <> -1 AND
            w.WebsiteId = tw.WebsiteId AND
            w.UserId = ?`,
          [id, userId]
        );

        if (relations) {
          await queryRunner.manager.query(
            `
            DELETE tw FROM Tag as t, TagWebsite as tw 
            WHERE 
              t.Name = ? AND
              tw.TagId = t.TagId AND
              tw.WebsiteId = ?`,
            [tag, id]
          );
        } else {
          await queryRunner.manager.delete(Website, { WebsiteId: id });
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

  async findNumberOfStudyMonitor(): Promise<number> {
    const manager = getManager();
    return (
      await manager.query(
        `SELECT COUNT(w.WebsiteId) as Websites FROM Website as w, User as u WHERE u.Type = "studies" AND w.UserId = u.UserId`
      )
    )[0].Websites;
  }

  async findNumberOfMyMonitor(): Promise<number> {
    const manager = getManager();
    return (
      await manager.query(
        `SELECT COUNT(w.WebsiteId) as Websites FROM Website as w, User as u WHERE u.Type = "monitor" AND w.UserId = u.UserId`
      )
    )[0].Websites;
  }

  async findNumberOfObservatory(): Promise<number> {
    const manager = getManager();
    return (
      await manager.query(`
      SELECT 
        COUNT(distinct w.WebsiteId) as Websites 
      FROM
        Directory as d,
        DirectoryTag as dt,
        TagWebsite as tw,
        Website as w 
      WHERE 
        d.Show_in_Observatory = 1 AND
        dt.DirectoryId = d.DirectoryId AND
        tw.TagId = dt.TagId AND 
        w.WebsiteId = tw.WebsiteId`)
    )[0].Websites;
  }

  async findCurrentDomain(websiteId: number): Promise<any> {
    const domain = await this.domainRepository.findOne({
      where: { WebsiteId: websiteId },
    });

    if (domain) {
      return domain.Url;
    } else {
      return null;
    }
  }

  async createOne(
    website: Website,
    domain: string,
    entities: string[],
    tags: string[]
  ): Promise<boolean> {
    if (domain.endsWith("/")) {
      domain = domain.substring(0, domain.length - 1);
    }

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const websites = await queryRunner.manager.query(
        `
        SELECT 
          w.*, d.Active 
        FROM 
          Website as w,
          Domain as d
        WHERE
          d.Url = ? AND
          w.WebsiteId = d.WebsiteId AND
          w.Deleted = "1"
        LIMIT 1
        `,
        [domain]
      );

      let websiteId = -1;

      if (websites.length > 0) {
        websiteId = websites[0].WebsiteId;

        const values = { Name: website.Name, Deleted: 0 };

        if (website.UserId !== null) {
          values["UserId"] = website.UserId;
        }

        await queryRunner.manager.update(
          Website,
          { WebsiteId: websiteId },
          values
        );

        if (websites[0].Active === 0) {
          await queryRunner.manager.update(
            Domain,
            { WebsiteId: websiteId, Active: 1 },
            { Active: 0, End_Date: website.Creation_Date }
          );
          await queryRunner.manager.update(
            Domain,
            { WebsiteId: websiteId, Url: domain },
            { Active: 1, End_Date: null }
          );
        }
      } else {
        const insertWebsite = await queryRunner.manager.save(website);

        websiteId = insertWebsite.WebsiteId;

        const newDomain = new Domain();
        newDomain.WebsiteId = websiteId;
        newDomain.Url = domain;
        newDomain.Start_Date = website.Creation_Date;
        newDomain.Active = 1;

        await queryRunner.manager.save(newDomain);
      }

      for (const entity of entities || []) {
        await queryRunner.manager.query(
          `INSERT INTO EntityWebsite (EntityId, WebsiteId) VALUES (?, ?)`,
          [entity, websiteId]
        );
      }

      for (const tag of tags || []) {
        await queryRunner.manager.query(
          `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`,
          [tag, websiteId]
        );
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

  async update(
    websiteId: number,
    name: string,
    declaration: number | null,
    stamp: number | null,
    declarationDate: any | null,
    stampDate: any | null,
    userId: number,
    oldUserId: number,
    transfer: boolean,
    defaultEntities: number[],
    entities: number[],
    defaultTags: number[],
    tags: number[]
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.update(
        Website,
        { WebsiteId: websiteId },
        {
          Name: name,
          UserId: userId,
          Declaration: declaration,
          Declaration_Update_Date: declarationDate,
          Stamp: stamp,
          Stamp_Update_Date: stampDate,
        }
      );
      if (oldUserId === null && userId !== null) {
        if (transfer) {
          await queryRunner.manager.query(
            `
            UPDATE
              Domain as d, 
              DomainPage as dp, 
              Page as p,
              Evaluation as e
            SET 
              p.Show_In = "111",
              e.Show_To = "11" 
            WHERE
              d.WebsiteId = ? AND
              dp.DomainId = d.DomainId AND
              p.PageId = dp.PageId AND
              p.Show_In LIKE "101" AND
              e.PageId = p.PageId`,
            [websiteId]
          );
        }
      } else if (
        (oldUserId !== null && userId !== null && oldUserId !== userId) ||
        (oldUserId !== null && userId === null)
      ) {
        if (!transfer || (oldUserId && !userId)) {
          await queryRunner.manager.query(
            `
            UPDATE
              Domain as d, 
              DomainPage as dp, 
              Page as p,
              Evaluation as e
            SET 
              p.Show_In = "101",
              e.Show_To = "10" 
            WHERE
              d.WebsiteId = ? AND
              dp.DomainId = d.DomainId AND
              p.PageId = dp.PageId AND
              p.Show_In = "111" AND
              e.PageId = p.PageId`,
            [websiteId]
          );
        }

        await queryRunner.manager.query(
          `
          UPDATE 
            Domain as d, 
            DomainPage as dp, 
            Page as p,
            Evaluation as e
          SET 
            p.Show_In = "100",
            e.Show_To = "10"
          WHERE
            d.WebsiteId = ? AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId AND
            p.Show_In = "110" AND
            e.PageId = p.PageId`,
          [websiteId]
        );

        await queryRunner.manager.query(
          `
          UPDATE 
            Domain as d, 
            DomainPage as dp, 
            Page as p,
            Evaluation as e
          SET 
            p.Show_In = "000",
            e.Show_To = "10"
          WHERE
            d.WebsiteId = ? AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId AND
            p.Show_In = "010" AND
            e.PageId = p.PageId`,
          [websiteId]
        );
      }

      for (const id of defaultEntities || []) {
        if (!entities.includes(id)) {
          await queryRunner.manager.query(
            `DELETE FROM EntityWebsite WHERE EntityId = ? AND WebsiteId = ?`,
            [id, websiteId]
          );
        }
      }

      for (const id of entities || []) {
        if (!defaultEntities.includes(id)) {
          await queryRunner.manager.query(
            `INSERT INTO EntityWebsite (EntityId, WebsiteId) VALUES (?, ?)`,
            [id, websiteId]
          );
        }
      }

      for (const id of defaultTags || []) {
        if (!tags.includes(id)) {
          await queryRunner.manager.query(
            `DELETE FROM TagWebsite WHERE TagId = ? AND WebsiteId = ?`,
            [id, websiteId]
          );
        }
      }

      for (const id of tags || []) {
        if (!defaultTags.includes(id)) {
          await queryRunner.manager.query(
            `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`,
            [id, websiteId]
          );
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

  async updatePagesObservatory(pages: any[], pagesId: number[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const page of pages || []) {
        let show = null;

        if (!pagesId.includes(page.PageId)) {
          show = page.Show_In[0] + page.Show_In[2] + "0";
        } else {
          show = page.Show_In[0] + page.Show_In[2] + "1";
        }

        await queryRunner.manager.update(
          Page,
          { PageId: page.PageId },
          { Show_In: show }
        );
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

  async delete(websiteId: number): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.query(
        `DELETE FROM TagWebsite WHERE WebsiteId = ? AND TagId <> 0`,
        [websiteId]
      );

      const pages = await queryRunner.manager.query(
        `
        SELECT
          dp.PageId 
        FROM 
          Domain as d, 
          DomainPage as dp
        WHERE
          d.WebsiteId = ? AND
          dp.DomainId = d.DomainId
      `,
        [websiteId]
      );

      if (pages.length > 0) {
        await queryRunner.manager.query(
          `
          DELETE FROM  
            Page
          WHERE
            PageId IN (?)
        `,
          [pages.map((p) => p.PageId)]
        );
      }

      const domains = await queryRunner.manager.query(
        `SELECT DomainId FROM Domain WHERE WebsiteId = ?`,
        [websiteId]
      );

      await queryRunner.manager.query(
        `
        DELETE FROM  
          Domain
        WHERE
          DomainId IN (?)
      `,
        [domains.map((d) => d.DomainId)]
      );

      await queryRunner.manager.query(
        //`UPDATE Website SET UserId = NULL, EntityId = NULL, Deleted = 1 WHERE WebsiteId = ?`,
        `DELETE FROM Website WHERE WebsiteId = ?`,
        [websiteId]
      );

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

    return websiteId;
  }

  async deleteBulk(websitesId: Array<number>): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.query(
        `DELETE FROM TagWebsite WHERE WebsiteId IN (?) AND TagId <> 0`,
        [websitesId]
      );

      const pages = await queryRunner.manager.query(
        `
        SELECT
          dp.PageId 
        FROM 
          Domain as d, 
          DomainPage as dp
        WHERE
          d.WebsiteId IN (?) AND
          dp.DomainId = d.DomainId
      `,
        [websitesId]
      );

      await queryRunner.manager.query(
        `
        DELETE FROM  
          Page
        WHERE
          PageId IN (?)
      `,
        [pages.map((p) => p.PageId)]
      );

      const domains = await queryRunner.manager.query(
        `SELECT DomainId FROM Domain WHERE WebsiteId IN (?)`,
        [websitesId]
      );

      await queryRunner.manager.query(
        `
        DELETE FROM  
          Domain
        WHERE
          DomainId IN (?)
      `,
        [domains.map((d) => d.DomainId)]
      );

      await queryRunner.manager.query(
        //`UPDATE Website SET UserId = NULL, EntityId = NULL, Deleted = 1 WHERE WebsiteId = ?`,
        `DELETE FROM Website WHERE WebsiteId IN (?)`,
        [websitesId]
      );

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

    return websitesId;
  }

  async import(websiteId: number, websiteName: string): Promise<any> {
    let returnWebsiteId = websiteId;
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const webDomain = await queryRunner.manager.query(
        `SELECT distinct w.*, d.*
        FROM 
          Page as p, 
          Domain as d, 
          Website as w,
          DomainPage as dp 
        WHERE 
          w.WebsiteId = ? AND
          d.WebsiteId = w.WebsiteId AND 
          d.Active = "1"`,
        [websiteId]
      );

      const domDate = webDomain[0].Start_Date.toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, "");
      const webDate = webDomain[0].Creation_Date.toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, "");

      const pages = await queryRunner.manager.query(
        `SELECT p.*
        FROM 
          Page as p, 
          Domain as d, 
          Website as w,
          DomainPage as dp 
        WHERE 
          w.WebsiteId = ? AND
          d.WebsiteId = w.WebsiteId AND 
          dp.domainId = d.DomainId AND
          dp.PageId = p.PageId`,
        [websiteId]
      );

      const domainP = (
        await queryRunner.manager.query(
          `SELECT distinct d.DomainId, w.*
        FROM  
          Domain as d,
          Website as w,
          User as u
        WHERE 
          d.Url = ? AND
          w.WebsiteId = d.WebsiteId AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type = "monitor"))
        LIMIT 1
        `,
          [webDomain[0].Url]
        )
      )[0];

      const domainUrl = webDomain[0].Url;

      if (webDomain.length > 0) {
        if (domainP) {
          for (const page of pages || []) {
            if (page.Show_In[0] === "0") {
              await this.importPage(queryRunner, page.PageId);
              try {
                await queryRunner.manager.query(
                  `INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`,
                  [domainP.DomainId, page.PageId]
                );
              } catch (err) {
                // ignore - don't know why
              }
            }
          }
          if (domainP.Deleted === 1) {
            await queryRunner.manager.query(
              `UPDATE Website SET Name = ?, Creation_Date = ?, Deleted = "0" WHERE WebsiteId = ?`,
              [websiteName || domainP.Name, webDate, domainP.WebsiteId]
            );
          } else {
            await queryRunner.manager.query(
              `UPDATE Website SET Creation_Date = ? WHERE WebsiteId = ?`,
              [webDate, domainP.DomainId]
            );
          }
        } else {
          const insertWebsite = await queryRunner.manager.query(
            `INSERT INTO Website (Name, Creation_Date) VALUES (?, ?)`,
            [websiteName, webDate]
          );
          returnWebsiteId = insertWebsite.WebsiteId;

          const domain = await queryRunner.manager.query(
            `INSERT INTO Domain ( WebsiteId,Url, Start_Date, Active) VALUES (?, ?, ?, "1")`,
            [insertWebsite.websiteId, domainUrl, domDate]
          );

          for (const page of pages || []) {
            if (page.Show_In[0] === "0") {
              await this.importPage(queryRunner, page.PageId);
              await queryRunner.manager.query(
                `INSERT INTO DomainPage (DomainId, PageId) VALUES ("${domain.insertId}", "${page.PageId}")`,
                [domain.DomainId, page.PageId]
              );
            }
          }
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

    return returnWebsiteId;
  }

  private async importPage(queryRunner: any, pageId: number): Promise<any> {
    const page = await queryRunner.manager.query(
      `SELECT Show_In FROM Page WHERE PageId = ? LIMIT 1`,
      [pageId]
    );

    if (page.length > 0) {
      const show = "1" + page[0].Show_In[1] + page[0].Show_In[2];
      await queryRunner.manager.query(
        `UPDATE Page SET Show_In = ? WHERE PageId = ?`,
        [show, pageId]
      );

      const evaluation = await queryRunner.manager.query(
        `SELECT  e.EvaluationId, e.Show_To FROM Evaluation as e WHERE e.PageId = ? AND e.Show_To LIKE "_1" ORDER BY e.Evaluation_Date  DESC LIMIT 1`,
        [pageId]
      );

      const evalId = evaluation[0].EvaluationId;
      const showTo = evaluation[0].Show_To;

      if (evaluation.length > 0) {
        const newShowTo = "1" + showTo[1];
        await queryRunner.manager.query(
          `UPDATE Evaluation SET Show_To = ? WHERE EvaluationId = ?`,
          [newShowTo, evalId]
        );
      }
    }
  }
}
