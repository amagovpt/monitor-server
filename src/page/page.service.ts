import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, In, DataSource } from "typeorm";
import { Website } from "../website/website.entity";
import { Page } from "./page.entity";
import { Evaluation } from "../evaluation/evaluation.entity";

@Injectable()
export class PageService {
  constructor(
    @InjectRepository(Website)
    private readonly websiteRepository: Repository<Website>,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectDataSource()
    private readonly connection: DataSource
  ) {}

  async findUserType(username: string): Promise<any> {
    if (username === "admin") {
      return "nimda";
    }

    const user = await this.pageRepository.query(
      `SELECT * FROM User WHERE Username = ? LIMIT 1`,
      [username]
    );

    if (user) {
      return user[0].Type;
    } else {
      return null;
    }
  }

  async findNumberOfObservatory(): Promise<number> {
    const data = (
      await this.pageRepository.query(
        "SELECT * FROM Observatory ORDER BY Creation_Date DESC LIMIT 1"
      )
    )[0].Global_Statistics;

    const parsedData = JSON.parse(data);
    return parsedData.nPages;
  }

  async findNumberOfMyMonitor(): Promise<number> {
    return (
      await this.pageRepository.query(
        `SELECT COUNT(distinct p.PageId) as Pages 
        FROM Page as p, WebsitePage as wp, Website as w, User as u 
        WHERE u.Type = "monitor" AND w.UserId = u.UserId AND wp.WebsiteId = w.WebsiteId AND p.PageId = wp.PageId`
      )
    )[0].Pages;
  }

  async findAdminEvaluatingInEvaluationList(): Promise<number> {
    const result = await this.pageRepository.query(
      "SELECT COUNT(*) as Total FROM Evaluation_List WHERE UserId = -1 AND Is_Evaluating = 1"
    );
    return result[0].Total;
  }

  async findAdminWaitingInEvaluationList(): Promise<number> {
    const result = await this.pageRepository.query(
      "SELECT COUNT(*) as Total FROM Evaluation_List WHERE UserId = -1 AND Is_Evaluating = 0 AND Error IS NULL"
    );
    return result[0].Total;
  }

  async findAdminWithErrorInEvaluationList(): Promise<number> {
    const result = await this.pageRepository.query(
      "SELECT COUNT(*) as Total FROM Evaluation_List WHERE UserId = -1 AND Is_Evaluating = 0 AND Error IS NOT NULL"
    );
    return result[0].Total;
  }

  async findUserEvaluatingInEvaluationList(): Promise<number> {
    const result = await this.pageRepository.query(
      "SELECT COUNT(*) as Total FROM Evaluation_List WHERE UserId <> -1 AND Is_Evaluating = 1"
    );
    return result[0].Total;
  }

  async findUserWaitingInEvaluationList(): Promise<number> {
    const result = await this.pageRepository.query(
      "SELECT COUNT(*) as Total FROM Evaluation_List WHERE UserId <> -1 AND Is_Evaluating = 0 AND Error IS NULL"
    );
    return result[0].Total;
  }

  async findUserWithErrorInEvaluationList(): Promise<number> {
    const result = await this.pageRepository.query(
      "SELECT COUNT(*) as Total FROM Evaluation_List WHERE UserId <> -1 AND Is_Evaluating = 0 AND Error IS NOT NULL"
    );
    return result[0].Total;
  }

  async deleteAdminPagesWithError(pages: number[]): Promise<boolean> {
    try {
      await this.pageRepository.query(
        "DELETE FROM Evaluation_List WHERE EvaluationListId IN (?)",
        [pages]
      );
    } catch (err) {
      console.error(err);
      return false;
    }

    return true;
  }

  async getAdminPagesWithError(): Promise<any> {
    const result = await this.pageRepository.query(
      "SELECT * FROM Evaluation_List WHERE UserId = -1 AND Is_Evaluating = 0 AND Error IS NOT NULL"
    );
    return result;
  }

  async getMyMonitorPagesWithError(): Promise<any> {
    const result = await this.pageRepository.query(`
      SELECT 
        el.Url,
        el.Error,
        el.Creation_Date,
        u.Username,
        u.UserId,
        w.Name as WebsiteName,
        w.StartingUrl
      FROM Evaluation_List el
      JOIN User u ON u.UserId = el.UserId
      LEFT JOIN Page p ON p.Uri = el.Url
      LEFT JOIN WebsitePage wp ON wp.PageId = p.PageId  
      LEFT JOIN Website w ON w.WebsiteId = wp.WebsiteId
      WHERE u.Type = "monitor" 
        AND el.Is_Evaluating = 0 
        AND el.Error IS NOT NULL
      ORDER BY el.Creation_Date DESC
    `);
    return result;
  }

  async adminCount(search: string): Promise<any> {
    const count = await this.pageRepository.query(
      `SELECT COUNT(*) as Count
      FROM 
        Page
      WHERE
        Uri LIKE ? AND
        Show_In LIKE '1%'`,
      [search.trim() !== "" ? `%${search.trim()}%` : "%"]
    );

    return count[0].Count;
  }

  async count(): Promise<number> {
    return this.pageRepository.count();
  }

  async findAll(
    size: number,
    page: number,
    sort: string,
    direction: string,
    search: string
  ): Promise<any> {
    if (!direction.trim()) {
      const pages = await this.pageRepository.query(
        `SELECT p.*, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date, e.Element_Count, e.Tag_Count
        FROM 
          Page as p
          LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Evaluation_Date = (
            SELECT Evaluation_Date FROM Evaluation 
            WHERE PageId = p.PageId
            ORDER BY Evaluation_Date DESC LIMIT 1
          )
        WHERE
          p.Uri LIKE ? AND
          p.Show_In LIKE '1%'
        GROUP BY p.PageId, e.Score, e.Evaluation_Date, e.Element_Count, e.Tag_Count
        LIMIT ? OFFSET ?`,
        [search.trim() !== "" ? `%${search.trim()}%` : "%", size, page * size]
      );
      console.log(pages[0]);
      return pages.map((p) => {
        p.Error = null;
        return p;
      });
    } else {
      let order = "";
      switch (sort) {
        case "Uri":
          order = "p.Uri";
          break;
        case "Score":
          order = "e.Score";
          break;
        case "A":
          order = "e.A";
          break;
        case "AA":
          order = "e.AA";
          break;
        case "AAA":
          order = "e.AAA";
          break;
        case "Evaluation_Date":
          order = "e.Evaluation_Date";
          break;
        case "State":
          order = `el.Is_Evaluating ${direction.toUpperCase()}, el.Error`;
          break;
        case "Show_In":
          order = "p.Show_In";
          break;
      }

      const pages = await this.pageRepository.query(
        `SELECT p.*, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date, e.Element_Count, e.Tag_Count
        FROM 
          Page as p
          LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Evaluation_Date = (
            SELECT Evaluation_Date FROM Evaluation 
            WHERE PageId = p.PageId
            ORDER BY Evaluation_Date DESC LIMIT 1
          )
        WHERE
          p.Uri LIKE ? AND
          p.Show_In LIKE '1%'
        GROUP BY p.PageId, e.Score, e.Evaluation_Date, e.Element_Count, e.Tag_Count
        ORDER BY ${order} ${direction.toUpperCase()}
        LIMIT ? OFFSET ?
        `,
        [search.trim() !== "" ? `%${search.trim()}%` : "%", size, page * size]
      );
      console.log(pages[0]);
      return pages.map((p) => {
        p.Error = null;
        return p;
      });
    }
  }

  async getObservatoryData(): Promise<any> {
    let data = new Array<any>();

    const directories = await this.pageRepository.query(
      `SELECT * FROM Directory WHERE Show_in_Observatory = 1`
    );

    for (const directory of directories) {
      const tags = await this.pageRepository.query(
        `SELECT t.* FROM DirectoryTag as dt, Tag as t WHERE dt.DirectoryId = ? AND t.TagId = dt.TagId`,
        [directory.DirectoryId]
      );
      const tagsId = tags.map((t) => t.TagId);

      let pages = null;
      if (parseInt(directory.Method) === 0) {
        pages = await this.pageRepository.query(
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
            w.StartingUrl,
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
            WebsitePage as wp,
            Page as p
            LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date = (
              SELECT Evaluation_Date FROM Evaluation 
              WHERE PageId = p.PageId AND Show_To LIKE "1_"
              ORDER BY Evaluation_Date DESC LIMIT 1
            )
          WHERE
            tw.TagId IN (?) AND
            w.WebsiteId = tw.WebsiteId AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId AND
            p.Show_In LIKE "__1"
          GROUP BY
            w.WebsiteId, p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Tot, e.Evaluation_Date
          HAVING
            COUNT(w.WebsiteId) = ?`,
          [tagsId, tagsId.length]
        );
      } else {
        pages = await this.pageRepository.query(
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
            w.StartingUrl,
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
            WebsitePage as wp,
            Page as p
            LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date = (
              SELECT Evaluation_Date FROM Evaluation 
              WHERE PageId = p.PageId AND Show_To LIKE "1_"
              ORDER BY Evaluation_Date DESC LIMIT 1
            )
          WHERE
            tw.TagId IN (?) AND
            w.WebsiteId = tw.WebsiteId AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId AND
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

          const entities = await this.pageRepository.query(
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

  async findAllFromMyMonitorUserWebsite(
    userId: number,
    websiteName: string
  ): Promise<any> {
    const website = await this.websiteRepository.findOne({
      where: { UserId: userId, Name: websiteName },
    });
    if (!website) {
      throw new InternalServerErrorException();
    }

    const pages = await this.pageRepository.query(
      `SELECT 
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
      WebsitePage as wp,
      Evaluation as e
    WHERE
      w.Name = ? AND
      w.UserId = ? AND
      wp.WebsiteId = w.WebsiteId AND
      p.PageId = wp.PageId AND
      e.PageId = p.PageId AND
      p.Show_In LIKE '_1_' AND
      e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId)`,
      [website.Name, website.UserId]
    );

    return pages;
  }

  async findStudyMonitorUserTagWebsitePages(
    userId: number,
    tag: string,
    website: string
  ): Promise<any> {
    const websiteExists = await this.pageRepository.query(
      `SELECT * FROM Website WHERE UserId = ? AND Name = ? LIMIT 1`,
      [userId, website]
    );

    if (!websiteExists) {
      throw new InternalServerErrorException();
    }

    const pages = await this.pageRepository.query(
      `SELECT 
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
        WebsitePage as wp,
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
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId AND StudyUserId = w.UserId);`,
      [tag, userId, website, userId]
    );

    return pages;
  }

  async findPageFromUrl(url: string): Promise<any> {
    return this.pageRepository.findOne({ where: { Uri: url } });
  }

  async isPageFromStudyMonitorUser(
    userId: number,
    tag: string,
    website: string,
    pageId: number
  ): Promise<any> {
    const pages = await this.pageRepository.query(
      `SELECT p.* FROM
        Tag as t,
        TagWebsite as tw,
        Website as w,
        WebsitePage as wp,
        Page as p
      WHERE
        t.Name = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.Name = ? AND
        w.UserId = ? AND
        wp.WebsiteId = w.WebsiteId AND
        wp.PageId = p.PageId AND
        p.PageId = ?
      `,
      [tag, userId, website, userId, pageId]
    );

    return pages.length > 0;
  }

  async isPageFromMyMonitorUser(userId: number, pageId: number): Promise<any> {
    const pages = await this.pageRepository.query(
      `SELECT p.* FROM
        Website as w,
        WebsitePage as wp,
        Page as p
      WHERE
        w.UserId = ? AND
        wp.WebsiteId = w.WebsiteId AND
        wp.PageId = p.PageId AND
        p.PageId = ?
      `,
      [userId, pageId]
    );

    return pages.length > 0;
  }

  async addPageToEvaluate(
    url: string,
    showTo: string = "10",
    userId: number | null = null,
    studyUserId: number | null = null
  ): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const page = await queryRunner.manager.findOne(Page, {
        where: { Uri: url },
      });

      const evalList = await queryRunner.manager.query(
        "SELECT * FROM Evaluation_List WHERE PageId = ? AND UserId = ? LIMIT 1",
        [page.PageId, userId]
      );

      if (evalList.length === 0) {
        await queryRunner.manager.query(
          `INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date, StudyUserId) VALUES (?, ?, ?, ?, ?, ?)`,
          [page.PageId, userId, page.Uri, showTo, new Date(), studyUserId]
        );
      } else {
        await queryRunner.manager.query(
          `UPDATE Evaluation_List SET Error = NULL, Is_Evaluating = 0 WHERE EvaluationListId = ?`,
          [evalList[0].EvaluationListId]
        );
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

  async addPagesToEvaluate(
    urls: string[],
    showTo: string = "10",
    userId: number | null = null,
    studyUserId: number | null = null
  ): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const url of urls ?? []) {
        const page = await queryRunner.manager.findOne(Page, {
          where: { Uri: url },
        });
        if (page) {
          const evalList = await queryRunner.manager.query(
            "SELECT * FROM Evaluation_List WHERE PageId = ? AND UserId = ? LIMIT 1",
            [page.PageId, userId]
          );

          if (evalList.length === 0) {
            await queryRunner.manager.query(
              `INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date, StudyUserId) VALUES (?, ?, ?, ?, ?, ?)`,
              [page.PageId, userId, page.Uri, showTo, new Date(), studyUserId]
            );
          } else {
            await queryRunner.manager.query(
              `UPDATE Evaluation_List SET Error = NULL, Is_Evaluating = 0 WHERE EvaluationListId = ?`,
              [evalList[0].EvaluationListId]
            );
          }
        }
      }

      await queryRunner.manager.query(
        `UPDATE Evaluation_Request_Counter SET Counter = Counter + ?, Last_Request = NOW() WHERE Application = "AMS/Observatory"`,
        [urls.length]
      );

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

  async addPages(
    websiteId: number,
    uris: string[],
    observatory: string[]
  ): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (let uri of uris || []) {
        uri = uri;
        const page = await this.pageRepository.findOne({
          select: ["PageId", "Show_In"],
          where: { Uri: uri },
        });

        if (page) {
          let newShowIn = "100";
          if (observatory.indexOf(uri) > -1) {
            if (page.Show_In[1] === "1") {
              newShowIn = "111";
            } else {
              newShowIn = "101";
            }
          } else {
            if (page.Show_In[1] === "1") {
              newShowIn = "110";
            }
          }

          await queryRunner.manager.update(
            Page,
            { PageId: page.PageId },
            { Show_In: newShowIn }
          );
        } else {
          let showIn = null;

          if (observatory.indexOf(uri) > -1) {
            showIn = "101";
          } else {
            showIn = "100";
          }

          const newPage = new Page();
          newPage.Uri = uri;
          newPage.Show_In = showIn;
          newPage.Creation_Date = new Date();

          const insertPage = await queryRunner.manager.save(newPage);
          await queryRunner.manager.query(
            `INSERT INTO WebsitePage (WebsiteId, PageId) VALUES (?, ?)`,
            [websiteId, insertPage.PageId]
          );

          await queryRunner.manager.query(
            `INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date) VALUES (?, ?, ?, ?, ?)`,
            [insertPage.PageId, -1, uri, "10", newPage.Creation_Date]
          );
        }
      }

      await queryRunner.manager.query(
        `UPDATE Evaluation_Request_Counter SET Counter = Counter + ?, Last_Request = NOW() WHERE Application = "AMS/Observatory"`,
        [uris.length]
      );

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

  convertStringToStringArray(numStr: string): string[] {
    // remove first and last character
    numStr = numStr.substring(1, numStr.length - 1);
    return numStr.split(",").map((s) => s.substring(1, numStr.length - 1).replace(/"+/g, ''));
  }

  async createMyMonitorUserWebsitePages(
    userId: number,
    website: string,
    startingUrl: string,
    uris: string[]
  ): Promise<boolean> {
    let uriArray: string[] = [];
    if (typeof uris === "string") {
      uriArray = this.convertStringToStringArray(uris);
    } else {
      uriArray = uris;
    }

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const uri of uriArray || []) {
        const page = await queryRunner.manager.findOne(Page, {
          where: { Uri: decodeURIComponent(uri) },
        });

        if (page) {
          const showIn = page.Show_In[0] + "1" + page.Show_In[2];
          await queryRunner.manager.update(
            Page,
            { PageId: page.PageId },
            { Show_In: showIn }
          );
          await queryRunner.manager.update(
            Evaluation,
            { PageId: page.PageId, Show_To: Like("1_") },
            { Show_To: "11" }
          );
        } else {
          const newPage = new Page();
          newPage.Uri = uri;
          newPage.Show_In = "010";
          newPage.Creation_Date = new Date();

          const insertPage = await queryRunner.manager.save(newPage);

          await queryRunner.manager.query(
            `INSERT INTO WebsitePage (WebsiteId, PageId) 
            SELECT 
              w.WebsiteId, 
              ?
            FROM
              Website as w
            WHERE 
              w.Name = ? AND
              w.UserId = ? AND
              w.startingUrl = ?`,
            [insertPage.PageId, website, userId, startingUrl]
          );

          await queryRunner.manager.query(
            `INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date) VALUES (?, ?, ?, ?, ?)`,
            [
              insertPage.PageId,
              userId,
              insertPage.Uri,
              "01",
              insertPage.Creation_Date,
            ]
          );
        }
      }

      await queryRunner.manager.query(
        `UPDATE Evaluation_Request_Counter SET Counter = Counter + ?, Last_Request = NOW() WHERE Application = "MyMonitor"`,
        [uris.length]
      );

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

  convertStringToNumberArray(numStr: string): number[] {
    // remove first and last character
    numStr = numStr.substring(1, numStr.length - 1);
    return numStr.split(",").map(Number);
  }

  async removeMyMonitorUserWebsitePages(
    userId: number,
    website: string,
    pagesIds: number[]
  ): Promise<any> {
    // this should not happen, but pagesIds type is string, so it needs to be converted to number[]
    let ids: number[] = [];
    if (typeof pagesIds === "string") {
      ids = this.convertStringToNumberArray(pagesIds);
    } else {
      ids = pagesIds;
    }
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const pageId of ids || []) {
        const page = await this.pageRepository.findOne({
          select: { Show_In: true },
          where: { PageId: pageId },
        });
        if (page) {
          const showIn = page.Show_In[0] + "0" + page.Show_In[2];
          await queryRunner.manager.update(
            Page,
            { PageId: pageId },
            { Show_In: showIn }
          );
          await queryRunner.manager.update(
            Evaluation,
            { PageId: pageId, Show_To: Like("11") },
            { Show_To: "10" }
          );
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

  async createStudyMonitorUserTagWebsitePages(
    userId: number,
    tag: string,
    website: string,
    startingUrl: string,
    uris: string[]
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const uri of uris || []) {
        const pageExists = await queryRunner.manager.findOne(Page, {
          where: { Uri: uri },
          select: ["PageId", "Uri", "Creation_Date"],
        });

        if (pageExists) {
          const websitePage = await queryRunner.manager.query(
            `SELECT 
              wp.* 
            FROM
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
              wp.PageId = ?`,
            [tag, userId, website, userId, pageExists.PageId]
          );

          if (websitePage.length === 0) {
            await queryRunner.manager.query(
              `INSERT INTO WebsitePage (WebsiteId, PageId) 
              SELECT 
                w.WebsiteId, 
                ? 
              FROM
                Tag as t,
                TagWebsite as tw,
                Website as w
              WHERE 
                t.Name = ? AND
                t.UserId = ? AND 
                tw.TagId = t.TagId AND
                w.WebsiteId = tw.WebsiteId AND
                w.Name = ? AND
                w.UserId = ?`,
              [pageExists.PageId, tag, userId, website, userId]
            );
          }

          await queryRunner.manager.query(
            `INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date, StudyUserId) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              pageExists.PageId,
              userId,
              pageExists.Uri,
              "00",
              pageExists.Creation_Date,
              userId,
            ]
          );
        } else {
          const newPage = new Page();
          newPage.Uri = uri;
          newPage.Show_In = "000";
          newPage.Creation_Date = new Date();

          const insertPage = await queryRunner.manager.save(newPage);

          await queryRunner.manager.query(
            `INSERT INTO WebsitePage (WebsiteId, PageId) 
            SELECT 
              w.WebsiteId, 
              ? 
            FROM
              Tag as t,
              TagWebsite as tw,
              Website as w
            WHERE 
              t.Name = ? AND
              t.UserId = ? AND 
              tw.TagId = t.TagId AND
              w.WebsiteId = tw.WebsiteId AND
              w.Name = ? AND
              w.UserId = ?`,
            [insertPage.PageId, tag, userId, website, userId]
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
              [existingWebsite[0].WebsiteId, insertPage.PageId]
            );
          }

          await queryRunner.manager.query(
            `INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date, StudyUserId) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              insertPage.PageId,
              userId,
              insertPage.Uri,
              "00",
              insertPage.Creation_Date,
              userId,
            ]
          );
        }
      }

      await queryRunner.manager.query(
        `UPDATE Evaluation_Request_Counter SET Counter = Counter + ?, Last_Request = NOW() WHERE Application = "StudyMonitor"`,
        [uris.length]
      );

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

  async removeStudyMonitorUserTagWebsitePages(
    userId: number,
    tag: string,
    website: string,
    pagesId: number[]
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.query(
        `
        DELETE 
          wp.* 
        FROM
          Tag as t,
          TagWebsite as tw,
          WebsitePage as wp
        WHERE 
          t.Name = ? AND
          t.UserId = ? AND
          tw.TagId = t.TagId AND
          wp.WebsiteId = tw.WebsiteId AND
          wp.PageId IN (?)`,
        [tag, userId, pagesId]
      );

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
      const page = await queryRunner.manager.findOne(Page, {
        where: { PageId: pageId },
      });

      if (page) {
        const both = new RegExp("[0-1][1][1]");
        const none = new RegExp("[0-1][0][0]");
        let show = null;

        if (both.test(page.Show_In)) {
          show = page.Show_In[0] + "10";
        } else if (page.Show_In[1] === "1" && checked) {
          show = page.Show_In[0] + "11";
        } else if (page.Show_In[1] === "1" && !checked) {
          show = page.Show_In[0] + "00";
        } else if (page.Show_In[2] === "1" && checked) {
          show = page.Show_In[0] + "11";
        } else if (page.Show_In[2] === "1" && !checked) {
          show = page.Show_In[0] + "00";
        } else if (none.test(page.Show_In)) {
          show = page.Show_In[0] + "01";
        }

        await queryRunner.manager.update(
          Page,
          { PageId: pageId },
          { Show_In: show }
        );
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
      /*for (const id of pages || []) {
        const page = await queryRunner.manager.findOne(Page, {
          where: { PageId: id },
        });

        if (page) {
          const show_in = page.Show_In;
          let new_show_in = "000";
          if (show_in[1] === "1") {
            new_show_in = "010";
          }
          await queryRunner.manager.update(
            Page,
            { PageId: id },
            { Show_In: new_show_in }
          );
        }
      }*/

      await queryRunner.manager.delete(Page, { PageId: In(pages) });

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

        let query: string;
        if (type === "studies") {
          query = `SELECT  e.EvaluationId, e.Show_To FROM Evaluation as e WHERE e.PageId = ? ORDER BY e.Evaluation_Date  DESC LIMIT 1`;
        } else {
          query = `SELECT e.EvaluationId, e.Show_To FROM Evaluation as e WHERE e.PageId = ? AND e.Show_To LIKE "_1" ORDER BY e.Evaluation_Date  DESC LIMIT 1`;
        }

        const evaluation = await queryRunner.manager.query(query, [pageId]);

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

  async importStudy(
    pageId: number,
    username: string,
    tagName: string,
    website: string
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const tag = await queryRunner.manager.query(
        `SELECT w.*
        FROM
          User as u,
          Tag as t, 
          Page as p, 
          Website as w,
          TagWebsite as tw,
          WebsitePage as wp 
        WHERE
          p.PageId = ?  AND 
          wp.PageId = p.PageId AND
          wp.WebsiteId = w.WebsiteId AND
          w.Name = ? AND
          tw.WebsiteId = w.WebsiteId AND 
          t.TagId = tw.TagId AND
          t.Name = ? AND
          u.UserId = t.UserId AND
          u.Username = ?`,
        [pageId, website, tagName, username]
      );

      const domDate = tag[0].Start_Date.toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, "");
      const webDate = tag[0].Creation_Date.toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, "");

      const websiteName = tag[0].Name;
      const websiteUrl = tag[0].StartingUrl;

      const websiteP = await queryRunner.manager.query(
        `
        SELECT w.WebsiteId, w.WebsiteId
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
        LIMIT 1
      `,
        [websiteUrl]
      );

      const websitePageExists = await queryRunner.manager.query(
        `SELECT wp.*
        FROM 
          WebsitePage as wp
        WHERE
          wp.WebsiteId = ? AND
          wp.PageId = ?`,
        [websiteP[0].WebsiteId, pageId]
      );

      if (tag.length > 0) {
        if (websiteP.length > 0) {
          if (websitePageExists.length <= 0) {
            await queryRunner.manager.query(
              `INSERT INTO WebsitePage (WebsiteId, PageId) VALUES (?, ?)`,
              [websiteP[0].WebsiteId, pageId]
            );
          }
        } else {
          const insertWebsite = await queryRunner.manager.query(
            `INSERT INTO Website (Name, StartingUrl, Creation_Date) VALUES (?, ?, ?)`,
            [websiteName, websiteUrl, webDate]
          );

          await queryRunner.manager.query(
            `INSERT INTO WebsitePage (WebsiteId, PageId) VALUES (?, ?)`,
            [insertWebsite.WebsiteId, pageId]
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
}
