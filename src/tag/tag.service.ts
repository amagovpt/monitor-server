import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, IsNull, In } from "typeorm";
import { Tag } from "./tag.entity";
import { Website } from "../website/website.entity";

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectDataSource()
    private readonly connection: DataSource  ) {}

  async addPagesToEvaluate(tagsId: number[], option: string): Promise<boolean> {
    const pages = await this.tagRepository.query(
      `
      SELECT
        p.PageId, 
        p.Uri
      FROM
        TagWebsite as tw,
        Website as w,
        WebsitePage as wp,
        Page as p
      WHERE
        tw.TagId IN (?) AND
        w.WebsiteId = tw.WebsiteId AND
        wp.WebsiteId = w.WebsiteId AND
        p.PageId = wp.PageId AND
        p.Show_In LIKE ?
    `,
      [tagsId, option === "all" ? "1__" : "1_1"]
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

  async findByTagName(tagName: string): Promise<Tag | undefined> {
    const tag = await this.tagRepository.findOne({ where: { Name: tagName } });
    return tag;
  }

  async findByOfficialTagName(tagName: string): Promise<Tag | undefined> {
    const tag = await this.tagRepository.findOne({
      where: { Name: tagName, UserId: IsNull() },
    });
    return tag;
  }

  async findInfo(tagId: number): Promise<any> {
    const tags = await this.tagRepository.query(
      `SELECT t.*, u.Username FROM Tag as t LEFT OUTER JOIN User as u ON u.UserId = t.UserId WHERE TagId = ? LIMIT 1`,
      [tagId]
    );

    if (tags) {
      const tag = tags[0];

      tag.directories = await this.tagRepository.query(
        `SELECT d.* 
        FROM
          DirectoryTag as dt,
          Directory as d
        WHERE
          dt.TagId = ? AND 
          d.DirectoryId = dt.DirectoryId`,
        [tagId]
      );

      tag.websites = await this.tagRepository.query(
        `SELECT w.*
        FROM
          TagWebsite as tw,
          Website as w
        WHERE
          tw.TagId = ? AND 
          w.WebsiteId = tw.WebsiteId`,
        [tagId]
      );

      return tag;
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findAll(): Promise<any> {
    const tags = await this.tagRepository.query(`SELECT 
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
    return (
      await this.tagRepository.query(
        `SELECT COUNT(t.TagId) as Tags FROM Tag as t, User as u WHERE u.Type = "studies" AND t.UserId = u.UserId`
      )
    )[0].Tags;
  }

  async findNumberOfObservatory(): Promise<number> {
    return (
      await this.tagRepository.query(`
        SELECT 
          COUNT(distinct t.TagId) as Tags 
        FROM 
          Directory as d,
          DirectoryTag as dt,
          Tag as t 
        WHERE 
          d.Show_in_Observatory = 1 AND
          dt.DirectoryId = d.DirectoryId AND
          t.TagId = dt.TagId 
          `)
    )[0].Tags;
  }

  async findAllFromStudyMonitorUser(userId: number): Promise<any> {
    const tags = await this.tagRepository.query(
      `SELECT 
        distinct t.*, 
        COUNT(distinct tw.WebsiteId) as Websites,
        COUNT(distinct wp.PageId) as Pages 
      FROM 
        Tag as t
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
        LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = tw.WebsiteId
      WHERE 
        t.UserId = ?
      GROUP BY t.TagId`,
      [userId]
    );

    return tags;
  }

  async findStudyMonitorUserTagData(userId: number, tag: string): Promise<any> {
    const pages = await this.tagRepository.query(
      `SELECT
        w.WebsiteId,
        w.Name,
        w.StartingUrl,
        p.Uri,
        e.Score,
        e.Tot,
        e.Errors,
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
        w.UserId = ? AND
        wp.WebsiteId = w.WebsiteId AND
        p.PageId = wp.PageId AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId AND StudyUserId = w.UserId);`,
      [tag, userId, userId]
    );

    return pages;
  }

  async findStudyMonitorUserTagWebsitesPagesData(
    userId: number,
    tag: string,
    website: string
  ): Promise<any> {
    const pages = await this.tagRepository.query(
      `SELECT 
        distinct p.*,
        e.Score,
        e.Errors,
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

  async getUserId(username: string): Promise<any> {
    return (
      await this.tagRepository.query(
        "SELECT * FROM User WHERE Username = ? LIMIT 1",
        [username]
      )
    )[0].UserId;
  }

  async findAllUserWebsitePages(
    tag: string,
    website: string,
    user: string
  ): Promise<any> {
    const userId = await this.getUserId(user);

    const websiteExists = await this.tagRepository.query(
      `SELECT * FROM Website WHERE UserId = ? AND Name = ? LIMIT 1`,
      [userId, website]
    );

    if (tag !== "null") {
      if (websiteExists) {
        const pages = await this.tagRepository.query(
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
            e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId)`,
          [tag, userId, website, userId]
        );

        return pages;
      }
    } else {
      if (websiteExists) {
        const pages = await this.tagRepository.query(
          `SELECT 
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
          [website, userId]
        );

        return pages;
      }
    }
  }

  async findAllWebsitePages(tag: string): Promise<any> {

    const websites = await this.tagRepository.query(
      `
      SELECT 
        w.WebsiteId,
        p.*,
        e.A,
        e.AA,
        e.AAA,
        e.Score,
        e.Errors,
        e.Tot,
        e.Evaluation_Date
      FROM 
        Tag as t,
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
        t.Name = ? AND
        t.UserId IS NULL AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        wp.WebsiteId = w.WebsiteId AND
        p.PageId = wp.PageId AND
        p.Show_In LIKE "1__"
      GROUP BY w.WebsiteId, p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Tot, e.Evaluation_Date`,
      [tag]
    );

    return websites; //.filter((w) => w.Score !== null);
  }

  async createOne(
    tag: Tag,
    directories: number[],
    websites: number[]
  ): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertTag = await queryRunner.manager.save(tag);

      for (const directoryId of directories || []) {
        await queryRunner.manager.query(
          `INSERT INTO DirectoryTag (DirectoryId, TagId) VALUES (?, ?)`,
          [directoryId, insertTag.TagId]
        );
      }

      for (const websiteId of websites || []) {
        await queryRunner.manager.query(
          `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`,
          [insertTag.TagId, websiteId]
        );
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

  async createDirectory(
    tag: Tag,
    tags: number[],
    method: string
  ): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertTag = await queryRunner.manager.save(tag);

      let websites = new Array<any>();
      if (tags.length > 0) {
        if (method === "cross") {
          websites = await queryRunner.manager.query(
            `SELECT WebsiteId
              FROM 
                TagWebsite
              WHERE 
                TagId IN (?)
              GROUP BY
	              WebsiteId
              HAVING
                COUNT(WebsiteId) = ?`,
            [tags, tags.length]
          );
        } else if (method === "join") {
          websites = await queryRunner.manager.query(
            `SELECT DISTINCT WebsiteId
              FROM 
                TagWebsite
              WHERE 
                TagId IN (?)`,
            [tags]
          );
        }
      } else {
        const tagId = tags[0];
        websites = await queryRunner.manager.query(
          `SELECT WebsiteId FROM TagWebsite WHERE TagId = ?`,
          [tagId]
        );
      }

      for (const website of websites || []) {
        await queryRunner.manager.query(
          `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`,
          [insertTag.TagId, website.WebsiteId]
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

  async createUserTag(tag: Tag, type: string, tagsId: number[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      if (type === "official" || type === "user") {
        const insertTag = await queryRunner.manager.save(tag);

        if (type === "official") {
          let websites = null;
          if (tagsId.length > 1) {
            websites = await queryRunner.manager.query(
              `SELECT w.Name, w.WebsiteId, w.StartingUrl
              FROM 
                TagWebsite as tw
                LEFT OUTER JOIN Website as w ON w.WebsiteId = tw.WebsiteId
              WHERE 
                tw.TagId IN (?)
              GROUP BY
                w.Name, w.WebsiteId, w.StartingUrl
              HAVING
                COUNT(tw.WebsiteId) = ?`,
              [tagsId, tagsId.length]
            );
          } else {
            websites = await queryRunner.manager.query(
              `SELECT w.Name, w.WebsiteId, w.StartingUrl
              FROM 
                TagWebsite as tw
                LEFT OUTER JOIN Website as w ON w.WebsiteId = tw.WebsiteId
              WHERE 
                tw.TagId = ?
              GROUP BY
                w.Name, w.WebsiteId, w.StartingUrl`,
              [tagsId[0]]
            );
          }

          for (const website of websites || []) {
            const newWebsite = new Website();
            newWebsite.name = website.Name;
            newWebsite.startingUrl = website.StartingUrl;
            newWebsite.userId = tag.UserId;
            newWebsite.creationDate = tag.Creation_Date;
            const insertWebsite = await queryRunner.manager.save(newWebsite);

            const pages = await queryRunner.manager.query(
              `SELECT wp.* FROM WebsitePage as wp, Page as p WHERE wp.WebsiteId = ? AND p.PageId = wp.PageId AND p.Show_In LIKE "1_1"`,
              [website.WebsiteId]
            );

            for (const page of pages || []) {
              await queryRunner.manager.query(
                `INSERT INTO WebsitePage (WebsiteId, PageId) VALUES (?, ?)`,
                [insertWebsite.websiteId, page.PageId]
              );
            }

            await queryRunner.manager.query(
              `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`,
              [insertTag.TagId, insertWebsite.websiteId]
            );
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

  async update(
    tagId: number,
    name: string,
    defaultDirectories: number[],
    directories: number[],
    defaultWebsites: number[],
    websites: number[]
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.update(Tag, { TagId: tagId }, { Name: name });

      for (const id of defaultDirectories || []) {
        if (!directories.includes(id)) {
          await queryRunner.manager.query(
            `DELETE FROM DirectoryTag WHERE DirectoryId = ? AND TagId = ?`,
            [id, tagId]
          );
        }
      }

      for (const id of directories || []) {
        if (!defaultDirectories.includes(id)) {
          await queryRunner.manager.query(
            `INSERT INTO DirectoryTag (DirectoryId, TagId) VALUES (?, ?)`,
            [id, tagId]
          );
        }
      }

      for (const id of defaultWebsites || []) {
        if (!websites.includes(id)) {
          await queryRunner.manager.query(
            `DELETE FROM TagWebsite WHERE TagId = ? AND WebsiteId = ?`,
            [tagId, id]
          );
        }
      }

      for (const id of websites || []) {
        if (!defaultWebsites.includes(id)) {
          await queryRunner.manager.query(
            `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`,
            [tagId, id]
          );
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
      await queryRunner.manager.delete(Tag, { TagId: tagId });
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

  async deleteBulk(tagsId: Array<number>): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.delete(Tag, { TagId: In(tagsId) });
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

  async pagesDeleteBulk(tagsId: Array<number>): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const websites = await queryRunner.manager.query(
        `
        SELECT * FROM TagWebsite WHERE TagId IN (?)
      `,
        [tagsId]
      );

      const pages = await queryRunner.manager.query(
        `
        SELECT
          PageId 
        FROM 
          WebsitePage
        WHERE
          WebsiteId IN (?)
      `,
        [websites.map((w) => w.WebsiteId)]
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

    return !hasError;
  }

  async removeUserTag(tagsId: number[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const id of tagsId || []) {
        const relations = await queryRunner.manager.query(
          `SELECT * FROM TagWebsite WHERE TagId = ? AND WebsiteId <> -1`,
          [id]
        );
        if (relations.length > 0) {
          const websitesId = relations.map((tw) => tw.WebsiteId);
          await queryRunner.manager.delete(Website, {
            WebsiteId: In(websitesId),
          });
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

    if (user === "admin") {
      const websites = await this.tagRepository.query(
        `SELECT w.*, u.Username as User, COUNT(distinct p.PageId) as Pages, COUNT(distinct e.PageId) as Evaluated_Pages
        FROM 
          Website as w
          LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = w.WebsiteId
          LEFT OUTER JOIN Page as p ON p.PageId = wp.PageId AND p.Show_In LIKE "1__"
          LEFT OUTER JOIN Evaluation as e ON e.PageId = p.PageId
          LEFT OUTER JOIN User as u ON u.UserId = w.UserId,
          Tag as t,
          TagWebsite as tw
        WHERE
          t.Name = ? AND
          t.UserId IS NULL AND
          tw.TagId = t.TagId AND
          w.WebsiteId = tw.WebsiteId
        GROUP BY w.WebsiteId`,
        [tag]
      );

      return websites;
    } else {
      const websites = await this.tagRepository.query(
        `SELECT w.*, e.Long_Name as Entity, u.Username as User 
      FROM 
        User as u,
        Tag as t,
        TagWebsite as tw,
        EntityWebsite as ew
        LEFT OUTER JOIN Website as w ON w.WebsiteId =  ew.WebsiteId
        LEFT OUTER JOIN Entity as e ON e.EntityId = ew.EntityId
      WHERE
        t.Name = ? AND
        u.Username = ? AND
        t.UserId = u.UserId AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId 
      GROUP BY w.WebsiteId, w.StartingUrl`,
        [tag, user]
      );

      return websites;
    }
  }

  async verifyUpdateWebsiteAdmin(websiteId: number): Promise<any> {

    const studyP = await this.tagRepository.query(
      `SELECT p.PageId
      FROM  
        Page as p, 
        WebsitePage as wp,
        Website as w
      WHERE 
        w.WebsiteId = ? AND
        wp.WebsiteId = w.WebsiteId AND
        wp.PageId = p.PageId AND
        p.Show_In LIKE '0%'`,
      [websiteId]
    );

    return studyP.length === 0;
  }

  async websiteExistsInAdmin(websiteId: number): Promise<any> {

    const websites = await this.tagRepository.query(
      `SELECT
        w2.*
      FROM
        Website as w,
        Website as w2
      WHERE
        w.WebsiteId = ? AND
        w2.StartingUrl = w.StartingUrl AND
        w2.WebsiteId != w.WebsiteId`,
      [websiteId]
    );

    return websites;
  }

  async import(tagId: number, tagName: string): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const websites = await queryRunner.manager.query(
        `SELECT tw.*, w.Name FROM TagWebsite as tw, Website as w WHERE tw.TagId = ? AND w.WebsiteId = tw.WebsiteId`,
        [tagId]
      );

      if (websites.length > 0) {
        const date = new Date()
          .toISOString()
          .replace(/T/, " ")
          .replace(/\..+/, "");
        const insertTag = await queryRunner.manager.query(
          `INSERT INTO Tag (Name, Creation_Date) 
                    VALUES (?, ?)`,
          [tagName, date]
        );

        for (const website of websites || []) {
          const websiteId = await this.importWebsite(
            queryRunner,
            website.WebsiteId,
            website.Name
          );
          await queryRunner.manager.query(
            `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`,
            [insertTag.insertId, websiteId]
          );
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

  private async importWebsite(
    queryRunner: any,
    websiteId: number,
    websiteName: string
  ): Promise<any> {
    let returnWebsiteId = websiteId;

    const website = await queryRunner.manager.query(
      `SELECT distinct w.*
      FROM  
        Website as w
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
          `INSERT INTO Website (Name, StartingUrl, Creation_Date) VALUES (?, ?)`,
          [websiteName, websiteUrl, webDate]
        );
        returnWebsiteId = insertWebsite.insertId;

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
