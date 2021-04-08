import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository, getManager, In } from "typeorm";
import { Directory } from "./directory.entity";

@Injectable()
export class DirectoryService {
  constructor(
    @InjectRepository(Directory)
    private readonly directoryRepository: Repository<Directory>,
    private readonly connection: Connection
  ) {}

  async addPagesToEvaluate(
    directoryId: number,
    option: string
  ): Promise<boolean> {
    const nTags = await this.directoryRepository.query(
      `SELECT * FROM DirectoryTag WHERE DirectoryId = ?`,
      [directoryId]
    );

    const pages = await this.directoryRepository.query(
      `
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
        tw.TagId IN (?) AND
        w.WebsiteId = tw.WebsiteId AND
        d.WebsiteId = w.WebsiteId AND
        d.Active = 1 AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        p.Show_In LIKE ?
      GROUP BY 
        w.WebsiteId, p.PageId
      HAVING 
        COUNT(w.WebsiteId) = ?
    `,
      [
        nTags.map((t) => t.TagId),
        option === "all" ? "1__" : "1_1",
        nTags.length,
      ]
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
            [page.PageId, -1, page.Uri, "10", new Date()]
          );
        } catch (_) {}
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

  async createOne(directory: Directory, tags: number[]): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertDirectory = await queryRunner.manager.save(directory);

      for (const tagId of tags || []) {
        await queryRunner.manager.query(
          `INSERT INTO DirectoryTag (DirectoryId, TagId) VALUES (?, ?)`,
          [insertDirectory.DirectoryId, tagId]
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
    directoryId: number,
    name: string,
    observatory: number,
    method: number,
    defaultTags: number[],
    tags: number[]
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.update(
        Directory,
        { DirectoryId: directoryId },
        { Name: name, Show_in_Observatory: observatory, Method: method }
      );

      for (const id of defaultTags || []) {
        if (!tags.includes(id)) {
          await queryRunner.manager.query(
            `DELETE FROM DirectoryTag WHERE DirectoryId = ? AND TagId = ?`,
            [directoryId, id]
          );
        }
      }

      for (const id of tags || []) {
        if (!defaultTags.includes(id)) {
          await queryRunner.manager.query(
            `INSERT INTO DirectoryTag (DirectoryId, TagId) VALUES (?, ?)`,
            [directoryId, id]
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

  async delete(directoryId: number): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.delete(Directory, { DirectoryId: directoryId });
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

  async deleteBulk(directoriesId: Array<number>): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.delete(Directory, { DirectoryId: In(directoriesId) });
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

  findByDirectoryName(directoryName: string): Promise<Directory | undefined> {
    return this.directoryRepository.findOne({ where: { Name: directoryName } });
  }

  findAll(): Promise<any> {
    const manager = getManager();
    return manager.query(`SELECT 
        d.*,
        COUNT(distinct dt.TagId) as Tags 
      FROM 
        Directory as d
        LEFT OUTER JOIN DirectoryTag as dt ON dt.DirectoryId = d.DirectoryId
      GROUP BY d.DirectoryId`);
  }

  async findNumberOfObservatory(): Promise<number> {
    return this.directoryRepository.count({ Show_in_Observatory: 1 });
  }

  async findInfo(directoryId: number): Promise<any> {
    const directories = await this.directoryRepository.query(
      `SELECT * FROM Directory WHERE DirectoryId = ? LIMIT 1`,
      [directoryId]
    );

    if (directories) {
      const directory = directories[0];

      directory.tags = await this.directoryRepository.query(
        `SELECT t.* 
        FROM
          DirectoryTag as dt,
          Tag as t 
        WHERE
          dt.DirectoryId = ? AND 
          t.TagId = dt.TagId`,
        [directoryId]
      );

      return directory;
    } else {
      throw new InternalServerErrorException();
    }
  }

  findAllDirectoryTags(directory: string): Promise<any> {
    const manager = getManager();
    return manager.query(
      `SELECT 
        t.*,
        COUNT(distinct tw.WebsiteId) as Websites 
      FROM
        Directory as d,
        DirectoryTag as dt,
        Tag as t
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
      WHERE
        d.Name = ? AND
        dt.DirectoryId = d.DirectoryId AND
        t.TagId = dt.TagId AND
        t.UserId IS NULL
      GROUP BY t.TagId`,
      [directory]
    );
  }

  async findAllDirectoryWebsites(directory: string): Promise<any> {
    const manager = getManager();

    const _directory = await manager.query(`SELECT * FROM Directory WHERE Name = ? LIMIT 1`, [directory])
    const method = _directory[0].Method;

    const nTags = await manager.query(
      `SELECT td.* FROM Directory as d, DirectoryTag as td WHERE d.Name = ? AND td.DirectoryId = d.DirectoryId`,
      [directory]
    );
    
    if (method === 0) {
      return manager.query(
        `SELECT 
          w.*, 
          u.Username as User, u.Type as Type, 
          d.DomainId, d.Url as Domain, 
          COUNT(distinct dp.PageId) as Pages
        FROM
          TagWebsite as tw,
          Website as w
          LEFT OUTER JOIN User as u ON u.UserId = w.UserId
          LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = "1"
          LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
        WHERE
          tw.TagId IN (?) AND
          w.WebsiteId = tw.WebsiteId AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies')) AND
          w.Deleted = "0"
        GROUP BY
          w.WebsiteId
        HAVING COUNT(distinct w.WebsiteId) = ?`,
        [nTags.map((t) => t.TagId), nTags.length]
      );
    } else {
      return manager.query(
        `SELECT DISTINCT
          w.*, 
          u.Username as User, u.Type as Type, 
          d.DomainId, d.Url as Domain, 
          COUNT(distinct dp.PageId) as Pages
        FROM
          TagWebsite as tw,
          Website as w
          LEFT OUTER JOIN User as u ON u.UserId = w.UserId
          LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = "1"
          LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
        WHERE
          tw.TagId IN (?) AND
          w.WebsiteId = tw.WebsiteId AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type != 'studies')) AND
          w.Deleted = "0"
        GROUP BY
          w.WebsiteId`,
        [nTags.map((t) => t.TagId)]
      );
    }
  }

  async findAllDirectoryWebsitePages(directory: string): Promise<any> {
    const manager = getManager();

    const _directory = await manager.query(`SELECT * FROM Directory WHERE Name = ? LIMIT 1`, [directory])
    const method = _directory[0].Method;

    const nTags = await manager.query(
      `SELECT td.* FROM Directory as d, DirectoryTag as td WHERE d.Name = ? AND td.DirectoryId = d.DirectoryId`,
      [directory]
    );

    if (method === 0) {
      const pages = await manager.query(
        `SELECT 
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
          TagWebsite as tw,
          Website as w,
          Domain as d,
          DomainPage as dp,
          Page as p
          LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "10" AND e.Evaluation_Date = (
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
          p.Show_In LIKE "1__"
        GROUP BY w.WebsiteId, p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Tot, e.Evaluation_Date
        HAVING COUNT(w.WebsiteId) = ?`,
        [nTags.map((t) => t.TagId), nTags.length]
      );

      return pages.filter((p) => p.Score !== null);
    } else {
      const pages = await manager.query(
        `SELECT DISTINCT
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
          TagWebsite as tw,
          Website as w,
          Domain as d,
          DomainPage as dp,
          Page as p
          LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Show_To LIKE "10" AND e.Evaluation_Date = (
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
          p.Show_In LIKE "1__"
        GROUP BY w.WebsiteId, p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Tot, e.Evaluation_Date`,
        [nTags.map((t) => t.TagId)]
      );

      return pages.filter((p) => p.Score !== null);
    } 
  }
}
