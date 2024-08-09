import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { Repository, In, DataSource } from "typeorm";
import { EntityTable } from "./entity.entity";

@Injectable()
export class EntityService {
  constructor(
    @InjectRepository(EntityTable)
    private readonly entityRepository: Repository<EntityTable>,
    @InjectDataSource()
    private readonly connection: DataSource
  ) {}

  async addPagesToEvaluate(
    entitiesId: number[],
    option: string
  ): Promise<boolean> {
    const pages = await this.entityRepository.query(
      `
      SELECT
        p.PageId, 
        p.Uri
      FROM
        Website as w,
        WebsitePage as wp,
        Page as p
      WHERE
        w.EntityId IN (?) AND
        wp.WebsiteId = w.WebsiteId AND
        p.PageId = wp.PageId AND
        p.Show_In LIKE ?
    `,
      [entitiesId, option === "all" ? "1__" : "1_1"]
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
    const name = search.trim() !== "" ? `%${search.trim()}%` : "%";
    const count = await this.entityRepository.query(
      `
      SELECT 
        COUNT(*) as Count 
      FROM 
        Entity 
      WHERE
        Short_Name LIKE ? OR
        Long_Name LIKE ?
        `,
      [name, name]
    );

    return count[0].Count;
  }

  async findNumberOfObservatory(): Promise<number> {
    const data = (
      await this.entityRepository.query(
        "SELECT * FROM Observatory ORDER BY Creation_Date DESC LIMIT 1"
      )
    )[0].Global_Statistics;

    const parsedData = JSON.parse(data);
    return parsedData.nEntities;
  }

  async findAll(
    size: number,
    page: number,
    sort: string,
    direction: string,
    search: string
  ): Promise<any> {
    const name = search.trim() !== "" ? `%${search.trim()}%` : "%";
    if (!direction.trim()) {
      if (size !== -1) {
        const entities = await this.entityRepository.query(
          `SELECT e.*, COUNT(distinct ew.WebsiteId) as Websites 
          FROM 
            Entity as e 
            LEFT OUTER JOIN EntityWebsite as ew ON ew.EntityId = e.EntityId
          WHERE
            e.Short_Name LIKE ? OR
            e.Long_Name LIKE ?
          GROUP BY e.EntityId
          LIMIT ? OFFSET ?`,
          [name, name, size, page * size]
        );
        return entities;
      } else {
        const entities = await this.entityRepository.query(
          `SELECT e.*, COUNT(distinct ew.WebsiteId) as Websites 
          FROM 
            Entity as e 
            LEFT OUTER JOIN EntityWebsite as ew ON ew.EntityId = e.EntityId
          WHERE
            e.Short_Name LIKE ? OR
            e.Long_Name LIKE ?
          GROUP BY e.EntityId`,
          [name, name]
        );
        return entities;
      }
    } else {
      let order = "";
      switch (sort) {
        case "Short_Name":
          order = "e.Short_Name";
          break;
        case "Long_Name":
          order = "e.Long_Name";
          break;
        case "Creation_Date":
          order = "e.Creation_Date";
          break;
        case "Websites":
          order = `Websites`;
          break;
      }

      const entities = await this.entityRepository.query(
        `SELECT e.*, COUNT(distinct ew.WebsiteId) as Websites 
        FROM 
          Entity as e 
          LEFT OUTER JOIN EntityWebsite as ew ON ew.EntityId = e.EntityId
        WHERE
          e.Short_Name LIKE ? OR
          e.Long_Name LIKE ?
        GROUP BY e.EntityId
        ORDER BY ${order} ${direction.toUpperCase()}
        LIMIT ? OFFSET ?`,
        [name, name, size, page * size]
      );
      return entities;
    }
  }

  async findInfo(entityId: number): Promise<any> {
    const entity = await this.entityRepository.findOne({
      where: { EntityId: entityId },
    });

    if (entity) {
      entity["websites"] = await this.entityRepository.query(
        `SELECT w.*
        FROM 
          EntityWebsite as ew, 
          Website as w
        WHERE 
          ew.EntityId = ? AND 
          w.WebsiteId = ew.WebsiteId`,
        [entityId]
      );
      return entity;
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findByShortName(shortName: string): Promise<any> {
    return this.entityRepository.findOne({ where: { Short_Name: shortName } });
  }

  async findByLongName(longName: string): Promise<any> {
    return this.entityRepository.findOne({ where: { Long_Name: longName } });
  }

  async findAllWebsites(entity: string): Promise<any> {
    const websites = await this.entityRepository.query(
      `SELECT w.*, u.Username as User, COUNT(distinct p.PageId) as Pages, COUNT(distinct ev.PageId) as Evaluated_Pages
      FROM
        Entity as e
        LEFT OUTER JOIN EntityWebsite as ew ON ew.EntityId = e.EntityId
        LEFT OUTER JOIN Website as w ON w.WebsiteId = ew.WebsiteId
        LEFT OUTER JOIN WebsitePage as wp ON wp.WebsiteId = w.WebsiteId
        LEFT OUTER JOIN Page as p ON p.PageId = wp.PageId AND p.Show_In LIKE "1__"
        LEFT OUTER JOIN Evaluation as ev ON ev.PageId = p.PageId
        LEFT OUTER JOIN User as u ON u.UserId = w.UserId
      WHERE
        e.Long_Name = ?
      GROUP BY w.WebsiteId`,
      [entity]
    );

    return websites;
  }

  async findAllWebsitesPages(entity: string): Promise<any> {
    const websites = await this.entityRepository.query(
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
        Entity as en,
        EntityWebsite as ew,
        Website as w,
        WebsitePage as wp,
        Page as p
        LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "1_" AND e.Evaluation_Date = (
          SELECT Evaluation_Date FROM Evaluation 
          WHERE PageId = p.PageId AND Show_To LIKE "1_"
          ORDER BY Evaluation_Date DESC LIMIT 1
        )
      WHERE
        en.Long_Name = ? AND
        ew.EntityId = en.EntityId AND
        w.WebsiteId = ew.WebsiteId AND
        wp.WebsiteId = w.WebsiteId AND
        p.PageId = wp.PageId AND
        p.Show_In LIKE "1__"
      GROUP BY w.WebsiteId, p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Tot, e.Evaluation_Date`,
      [entity]
    );

    return websites; //.filter((w) => w.Score !== null);
  }

  async createOne(entity: EntityTable, websites: string[]): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertEntity = await queryRunner.manager.save(entity);

      for (const websiteId of websites || []) {
        await queryRunner.manager.query(
          `INSERT INTO EntityWebsite (EntityId, WebsiteId) VALUES (?, ?)`,
          [insertEntity.EntityId, websiteId]
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

  async update(
    entityId: number,
    shortName: string,
    longName: string,
    websites: number[],
    defaultWebsites: number[]
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.update(
        EntityTable,
        { EntityId: entityId },
        { Short_Name: shortName, Long_Name: longName }
      );

      for (const id of defaultWebsites || []) {
        if (!websites.includes(id)) {
          await queryRunner.manager.query(
            `DELETE FROM EntityWebsite WHERE EntityId = ? AND WebsiteId = ?`,
            [entityId, id]
          );
        }
      }

      for (const id of websites || []) {
        if (!defaultWebsites.includes(id)) {
          await queryRunner.manager.query(
            `INSERT INTO EntityWebsite (EntityId, WebsiteId) VALUES (?, ?)`,
            [entityId, id]
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

  async delete(entityId: number): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      /*await queryRunner.manager.update(
        Website,
        { EntityId: entityId },
        { EntityId: null }
      );*/

      await queryRunner.manager.delete(EntityTable, { EntityId: entityId });

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

  async deleteBulk(entitiesId: Array<number>): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.delete(EntityTable, {
        EntityId: In(entitiesId),
      });

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

  async pagesDeleteBulk(entitiesId: Array<number>): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const websites = await queryRunner.manager.query(
        `
        SELECT * FROM EntityWebsite WHERE EntityId IN (?)
      `,
        [entitiesId]
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
