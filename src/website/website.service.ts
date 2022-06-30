import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository, getManager, IsNull } from "typeorm";
import { Website } from "./website.entity";
import { Tag } from "../tag/tag.entity";
import { Page } from "../page/page.entity";
import { EvaluationService } from "../evaluation/evaluation.service";
import { AccessibilityStatementService } from "src/accessibility-statement-module/accessibility-statement/accessibility-statement.service";

@Injectable()
export class WebsiteService {
  constructor(
    @InjectRepository(Website)
    private readonly websiteRepository: Repository<Website>,
    private evaluationService: EvaluationService,
    private readonly accessibilityStatementService: AccessibilityStatementService,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    private readonly connection: Connection
  ) { }

  async getAllWebsiteDataCSV(): Promise<any> {
    const websites = await this.websiteRepository.find({ relations: ["Tags"] });
    websites.map(async (website) => {
      const id = website.WebsiteId;
      const pages = await this.findAllPages(id);
      website["numberOfPages"] = pages.length;
      website["averagePoints"] = this.averagePointsPageEvaluation(pages);
      return website;
    })

  }
  private averagePointsPageEvaluation(pages) {
    const totalPoints = pages.reduce((page, total) => { return total + page.Score });
    return totalPoints / pages.length;
  }

  async findAccessiblityStatements(): Promise<any> {
    const websites = await this.websiteRepository.find();
    for (const website of websites) {
      const id = website.WebsiteId;
      console.log(id);
      const pages = await this.websiteRepository.query(
        `Select 
            * 
          from 
            Page 
            JOIN WebsitePage on WebsitePage.PageId = Page.PageId 
          WHERE 
            WebsitePage.WebsiteId = ?`, [id]);
      await this.findAccessiblityStatementsInPageList(pages, website);
    }
  }
  async findAccessiblityStatementsInPageList(pages: Page[], website: Website): Promise<any> {
    for (const page of pages) {
      const id = page.PageId;
      const evaluation = await this.evaluationService.getLastEvaluationByPage(id);
      if (evaluation) {
        const rawHtml = Buffer.from(evaluation.Pagecode, "base64").toString();
        await this.accessibilityStatementService.createIfExist(rawHtml, website, page.Uri);
      }
    }
  }


  async addPagesToEvaluate(
    websitesId: number[],
    option: string
  ): Promise<boolean> {
    const pages = await this.websiteRepository.query(
      `
      SELECT 
        p.PageId, 
        p.Uri 
      FROM 
        WebsitePage as wp, 
        Page as p
      WHERE
        wp.WebsiteId IN (?) AND
        p.PageId = wp.PageId AND
        p.Show_In LIKE ?`,
      [websitesId, option === "all" ? "1__" : "1_1"]
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
        } catch (_) { }
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
        (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))`,
      [search.trim() !== "" ? `%${search.trim()}%` : "%"]
    );

    return count[0].Count;
  }

  async getIdFromUserAndName(user: string, name: string): Promise<number> {
    const manager = getManager();
    const website = await manager.query(
      `
      SELECT w.* FROM Website as w, User as u
      WHERE
        w.Name LIKE ? AND
        ((w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies')) OR
        w.UserId IS NOT NULL AND (u.UserId = w.UserId AND u.Username LIKE ?))
      LIMIT 1
    `,
      [name, user]
    );
    return website[0].WebsiteId;
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
          COUNT(distinct p.PageId) as Pages,
          COUNT(distinct e.PageId) as Evaluated_Pages
        FROM 
          Website as w
          LEFT OUTER JOIN User as u ON u.UserId = w.UserId
          LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = w.WebsiteId
          LEFT OUTER JOIN Page as p ON p.PageId = wp.PageId AND p.Show_In LIKE "1__"
          LEFT OUTER JOIN Evaluation as e ON e.PageId = p.PageId
        WHERE
          (w.Name LIKE ? OR w.StartingUrl LIKE ?) AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))
        GROUP BY w.WebsiteId
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
        case "StartingUrl":
          order = "w.StartingUrl";
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
          COUNT(distinct p.PageId) as Pages,
          COUNT(distinct e.PageId) as Evaluated_Pages
        FROM 
          Website as w
          LEFT OUTER JOIN User as u ON u.UserId = w.UserId
          LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = w.WebsiteId
          LEFT OUTER JOIN Page as p ON p.PageId = wp.PageId AND p.Show_In LIKE "1__"
          LEFT OUTER JOIN Evaluation as e ON e.PageId = p.PageId
        WHERE
          (w.Name LIKE ? OR w.StartingUrl LIKE ?) AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))
        GROUP BY w.WebsiteId
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
      `SELECT w.*, u.Username as User, e.Long_Name as Entity, COUNT(distinct wp.PageId) as Pages
      FROM 
        Website as w
        LEFT OUTER JOIN User as u ON u.UserId = w.UserId
        LEFT OUTER JOIN EntityWebsite as ew ON ew.WebsiteId = w.WebsiteId
        LEFT OUTER JOIN Entity as e ON e.EntityId = ew.EntityId
        LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = w.WebsiteId
      WHERE 
        w.WebsiteId = ?
      GROUP BY w.WebsiteId, w.StartingUrl 
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

  async findAllPages(websiteId: number): Promise<any> {
    const manager = getManager();

    const pages = await manager.query(
      `SELECT
        distinct p.*,
        e.Score,
        e.A,
        e.AA,
        e.AAA,
        e.Tot,
        e.Errors,
        e.Element_Count,
        e.Tag_Count,
        e.Evaluation_Date,
        el.EvaluationListId, el.Error, el.Is_Evaluating
      FROM
        WebsitePage as wp,
        Page as p
        LEFT OUTER JOIN Evaluation_List as el ON el.PageId = p.PageId AND el.UserId = -1
        LEFT OUTER JOIN Evaluation as e ON e.PageId = p.PageId AND e.Evaluation_Date IN (
          SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId
        )
      WHERE
        wp.WebsiteId = ? AND
        p.PageId = wp.PageId AND
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
        w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies')`);
    return websites;
  }

  async findByOfficialName(name: string): Promise<any> {
    const website = await this.websiteRepository.findOne({
      where: { Name: name, UserId: IsNull() },
    });
    return website;
    /*if (website && website.Name !== name) {
      return undefined;
    } else {
      return website;
    }*/
  }

  async existsUrl(url: string): Promise<any> {
    return (
      (
        await this.websiteRepository.query(
          `SELECT w.*
      FROM
        Website as w,
        User as u
      WHERE
        w.StartingUrl = ? AND
        (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))
      LIMIT 1`,
          [url]
        )
      ).length > 0
    );
  }

  async findAllWithoutUser(): Promise<any> {
    const manager = getManager();
    const websites = await manager.query(
      `SELECT * FROM Website WHERE UserId IS NULL`
    );
    return websites;
  }
  /**
 * 
 * SELECT distinct w.* 
      FROM 
        User as u ,
        EntityWebsite as ew
        LEFT OUTER JOIN Website as ew ON w.WebsiteId = ew.WebsiteId
      WHERE 
        ew.EntityId IS NULL AND
        (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))
 */
  async findAllWithoutEntity(): Promise<any> {
    const manager = getManager();
    const websites = await manager.query(`SELECT distinct w.* 
      FROM 
        User as u ,
        EntityWebsite as ew
        LEFT OUTER JOIN Website as ew ON w.WebsiteId = ew.WebsiteId
      WHERE 
        ew.EntityId IS NULL AND
        (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies'))`);
    return websites; //TODO: fix
  }

  async findAllFromMyMonitorUser(userId: number): Promise<any> {
    const manager = getManager();
    const websites = await manager.query(
      `SELECT w.*, COUNT(distinct p.PageId) as Pages
      FROM
        Website as w
        LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = w.WebsiteId
        LEFT OUTER JOIN Page as p ON p.PageId = wp.PageId AND p.Show_In LIKE '_1%'
      WHERE
        w.UserId = ?
      GROUP BY w.WebsiteId, w.StartingUrl`,
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
          WebsitePage as wp,
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
          wp.WebsiteId = w.WebsiteId AND
          p.PageId = wp.PageId and
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
        WebsitePage as wp
      WHERE
        w.Name = ? AND
        w.UserId = ? AND
        wp.WebsiteId = w.WebsiteId AND
        p.PageId = wp.PageId AND
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
        } catch (_) { }
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
        WebsitePage as wp
      WHERE
        t.Name = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.Name = ? AND
        w.UserId = ? AND
        wp.WebsiteId = w.WebsiteId AND
        p.PageId = wp.PageId`,
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
        } catch (_) { }
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
          w.StartingUrl,
          COUNT(distinct p.PageId) as Pages,
          AVG(e.Score) as Score
        FROM
          Tag as t,
          TagWebsite as tw,
          Website as w
          LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = w.WebsiteId
          LEFT OUTER JOIN Page as p ON p.PageId = wp.PageId
          LEFT OUTER JOIN Evaluation as e ON e.StudyUserId = ? AND e.Evaluation_Date IN (
            SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId AND StudyUserId = e.StudyUserId
          )
        WHERE
          t.Name = ? AND
          t.UserId = ? AND
          tw.TagId = t.TagId AND
          w.WebsiteId = tw.WebsiteId AND
          w.UserId = ?
        GROUP BY w.WebsiteId, w.StartingUrl`,
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
        t.Name as TagName
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w
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
        w.StartingUrl NOT IN (
          SELECT 
            w2.StartingUrl 
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

  async findStudyMonitorUserTagWebsiteByStartingUrl(
    userId: number,
    tag: string,
    startingUrl: string
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
        w.StartingUrl = ?
      LIMIT 1`,
      [tag, userId, userId, startingUrl]
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
    startingUrl: string,
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
      newWebsite.StartingUrl = startingUrl;
      newWebsite.Creation_Date = new Date();

      const insertWebsite = await queryRunner.manager.save(newWebsite);

      await queryRunner.manager.query(
        `INSERT INTO TagWebsite (TagId, WebsiteId) SELECT TagId, ? FROM Tag WHERE Name = ?`,
        [insertWebsite.WebsiteId, tag]
      );

      for (const url of pages || []) {
        const page = await queryRunner.manager.findOne(Page, {
          where: { Uri: url },
        });
        if (page) {
          await queryRunner.manager.query(
            `INSERT INTO WebsitePage (WebsiteId, PageId) VALUES (?, ?)`,
            [insertWebsite.WebsiteId, page.PageId]
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
            `INSERT INTO WebsitePage (WebsiteId, PageId) VALUES (?, ?)`,
            [insertWebsite.WebsiteId, insertPage.PageId]
          );

          const existingWebsite = await queryRunner.manager.query(
            `SELECT distinct w.WebsiteId, w.StartingUrl 
            FROM
              User as u,
              Website as w
            WHERE
              w.StartingUrl = ? AND
              (
                w.UserId IS NULL OR
                (
                  u.UserId = w.UserId AND
                  u.Type = 'monitor'
                )
              )
            LIMIT 1`,
            [startingUrl]
          );

          if (existingWebsite.length > 0) {
            await queryRunner.manager.query(
              `INSERT INTO WebsitePage (WebsiteId, PageId) VALUES (?, ?)`,
              [existingWebsite[0].WebsiteId, newPage.PageId]
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
    /*const manager = getManager();
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
    )[0].Websites;*/
    const manager = getManager();

    const data = (
      await manager.query(
        "SELECT * FROM Observatory ORDER BY Creation_Date DESC LIMIT 1"
      )
    )[0].Global_Statistics;
    const dataPrint = await manager.query(
      `SELECT 
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
        w.WebsiteId = tw.WebsiteId`);
    console.log(dataPrint[0].Websites);
    const parsedData = JSON.parse(data);
    return parsedData.nWebsites;
  }

  async createOne(
    website: Website,
    startingUrl: string,
    entities: string[],
    tags: string[]
  ): Promise<boolean> {
    if (startingUrl.endsWith("/")) {
      startingUrl = startingUrl.substring(0, startingUrl.length - 1);
    }

    website.StartingUrl = startingUrl;

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertWebsite = await queryRunner.manager.save(website);

      for (const entity of entities || []) {
        await queryRunner.manager.query(
          `INSERT INTO EntityWebsite (EntityId, WebsiteId) VALUES (?, ?)`,
          [entity, insertWebsite.WebsiteId]
        );
      }

      for (const tag of tags || []) {
        await queryRunner.manager.query(
          `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`,
          [tag, insertWebsite.WebsiteId]
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
    startingUrl: string,
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
          StartingUrl: startingUrl,
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
              WebsitePage as wp, 
              Page as p,
              Evaluation as e
            SET 
              p.Show_In = "111",
              e.Show_To = "11" 
            WHERE
              wp.WebsiteId = ? AND
              p.PageId = wp.PageId AND
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
              WebsitePage as wp, 
              Page as p,
              Evaluation as e
            SET 
              p.Show_In = "101",
              e.Show_To = "10" 
            WHERE
              wp.WebsiteId = ? AND
              p.PageId = wp.PageId AND
              p.Show_In = "111" AND
              e.PageId = p.PageId`,
            [websiteId]
          );
        }

        await queryRunner.manager.query(
          `
          UPDATE  
            WebsitePage as wp, 
            Page as p,
            Evaluation as e
          SET 
            p.Show_In = "100",
            e.Show_To = "10"
          WHERE
            wp.WebsiteId = ? AND
            p.PageId = wp.PageId AND
            p.Show_In = "110" AND
            e.PageId = p.PageId`,
          [websiteId]
        );

        await queryRunner.manager.query(
          `
          UPDATE 
            WebsitePage as wp, 
            Page as p,
            Evaluation as e
          SET 
            p.Show_In = "000",
            e.Show_To = "10"
          WHERE
            wp.WebsiteId = ? AND
            p.PageId = wp.PageId AND
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

  async findMyMonitorUserWebsiteStartingUrl(
    userId: number,
    websiteName: string
  ): Promise<any> {
    const manager = getManager();
    const website = await manager.query(
      `SELECT w.StartingUrl FROM 
        Website as w
      WHERE
        w.UserId = ? AND
        w.Name = ?
      LIMIT 1`,
      [userId, websiteName]
    );

    return website ? website[0].StartingUrl : null;
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
          wp.PageId 
        FROM 
          WebsitePage as wp
        WHERE
          wp.WebsiteId = ?
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
          wp.PageId 
        FROM 
          WebsitePage as wp
        WHERE
          wp.WebsiteId IN (?)
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

  async pagesDeleteBulk(websitesId: Array<number>): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const pages = await queryRunner.manager.query(
        `
        SELECT
          PageId 
        FROM 
          WebsitePage
        WHERE
          WebsiteId IN (?)
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
      const website = await queryRunner.manager.query(
        `SELECT *
        FROM 
          Website
        WHERE 
          w.WebsiteId = ?`,
        [websiteId]
      );

      const webDate = website[0].Creation_Date.toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, "");

      const pages = await queryRunner.manager.query(
        `SELECT p.*
        FROM 
          Page as p,  
          Website as w,
          WebsitePage as wp 
        WHERE 
          w.WebsiteId = ? AND
          wp.WebsiteId = w.WebsiteId AND
          wp.PageId = p.PageId`,
        [websiteId]
      );

      const websiteP = (
        await queryRunner.manager.query(
          `SELECT distinct w.*
        FROM  
          Website as w,
          User as u
        WHERE 
          w.StartingUrl = ? AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type = "monitor"))
        LIMIT 1
        `,
          [website[0].StartingUrl]
        )
      )[0];

      const websiteUrl = website[0].StartingUrl;

      if (website.length > 0) {
        if (websiteP) {
          for (const page of pages || []) {
            if (page.Show_In[0] === "0") {
              await this.importPage(queryRunner, page.PageId);
              try {
                await queryRunner.manager.query(
                  `INSERT INTO WebsitePage (WebsiteId, PageId) VALUES (?, ?)`,
                  [websiteP.WebsiteId, page.PageId]
                );
              } catch (err) {
                // ignore - don't know why
              }
            }
          }

          await queryRunner.manager.query(
            `UPDATE Website SET Creation_Date = ? WHERE WebsiteId = ?`,
            [webDate, websiteP.WebsiteId]
          );
        } else {
          const insertWebsite = await queryRunner.manager.query(
            `INSERT INTO Website (Name, StartingUrl, Creation_Date) VALUES (?, ?, ?)`,
            [websiteName, websiteUrl, webDate]
          );
          returnWebsiteId = insertWebsite.WebsiteId;

          for (const page of pages || []) {
            if (page.Show_In[0] === "0") {
              await this.importPage(queryRunner, page.PageId);
              await queryRunner.manager.query(
                `INSERT INTO WebsitePage (WebsiteId, PageId) VALUES ("${website.insertId}", "${page.PageId}")`,
                [website.WebsiteId, page.PageId]
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
