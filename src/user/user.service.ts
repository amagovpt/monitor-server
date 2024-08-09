import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { Repository, In, DataSource } from "typeorm";
import { User } from "./user.entity";
import { Tag } from "../tag/tag.entity";
import { Website } from "../website/website.entity";
import { comparePasswordHash, generatePasswordHash } from "../lib/security";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectDataSource()
    private readonly connection: DataSource
  ) {}

  async changePassword(
    userId: number,
    password: string,
    newPassword: string
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const user = await this.userRepository.findOne({
        where: { UserId: userId },
      });
      if (user && (await comparePasswordHash(password, user.Password))) {
        const newPasswordHash = await generatePasswordHash(newPassword);
        await queryRunner.manager.update(
          User,
          { UserId: userId },
          { Password: newPasswordHash }
        );
      } else {
        hasError = true;
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

    if (hasError) {
      throw new UnauthorizedException();
    }

    return true;
  }

  async update(
    userId: number,
    password: string,
    names: string,
    emails: string,
    app: string,
    defaultWebsites: number[],
    websites: number[],
    transfer: boolean
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.update(
        User,
        { UserId: userId },
        { Names: names, Emails: emails }
      );

      if (password && password !== "null") {
        await queryRunner.manager.update(
          User,
          { UserId: userId },
          { Password: await generatePasswordHash(password) }
        );
      }

      if (app === "monitor") {
        for (const id of defaultWebsites || []) {
          if (!websites.includes(id)) {
            await queryRunner.manager.query(
              `
              UPDATE
                Website as w, 
                WebsitePage as wp, 
                Page as p,
                Evaluation as e
              SET 
                p.Show_In = "101",
                e.Show_To = "10" 
              WHERE
                w.WebsiteId = ? AND
                wp.WebsiteId = w.WebsiteId AND
                p.PageId = wp.PageId AND
                p.Show_In = "111" AND
                e.PageId = p.PageId`,
              [id]
            );

            await queryRunner.manager.query(
              `
              UPDATE 
                Website as w, 
                WebsitePage as wp, 
                Page as p,
                Evaluation as e
              SET 
                p.Show_In = "100",
                e.Show_To = "10"
              WHERE
                w.WebsiteId = ? AND
                wp.WebsiteId = w.WebsiteId AND
                p.PageId = wp.PageId AND
                p.Show_In = "110" AND
                e.PageId = p.PageId`,
              [id]
            );

            await queryRunner.manager.query(
              `
              UPDATE 
                Website as w, 
                WebsitePage as wp, 
                Page as p,
                Evaluation as e
              SET 
                p.Show_In = "000",
                e.Show_To = "10" 
              WHERE
                w.WebsiteId = ? AND
                wp.WebsiteId = w.WebsiteId AND
                p.PageId = wp.PageId AND
                p.Show_In = "010" AND
                e.PageId = p.PageId`,
              [id]
            );

            await queryRunner.manager.update(
              Website,
              { WebsiteId: id },
              { UserId: null }
            );
          }
        }

        for (const id of websites || []) {
          if (!defaultWebsites.includes(id)) {
            await queryRunner.manager.update(
              Website,
              { WebsiteId: id },
              { UserId: userId }
            );

            if (transfer) {
              await queryRunner.manager.query(
                `UPDATE Website as w, WebsitePage as wp, Page as p, Evaluation as e SET p.Show_In = "111", e.Show_To = "11" 
                WHERE
                  w.WebsiteId = ? AND
                  wp.WebsiteId = w.WebsiteId AND
                  p.PageId = wp.PageId AND
                  p.Show_In = "101" AND
                  e.PageId = p.PageId`,
                [id]
              );
            }
          }
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

  async delete(userId: number, app: string): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      if (app === "monitor") {
        await queryRunner.manager.query(
          `
          UPDATE 
            Website as w,
            WebsitePage as wp, 
            Page as p 
          SET 
            p.Show_In = "101" 
          WHERE
            w.UserId = ? AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId AND
            p.Show_In LIKE "111"`,
          [userId]
        );

        await queryRunner.manager.query(
          `
          UPDATE 
            Website as w,
            WebsitePage as wp, 
            Page as p 
          SET 
            p.Show_In = "100" 
          WHERE
            w.UserId = ? AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId AND
            p.Show_In = "110"`,
          [userId]
        );

        await queryRunner.manager.query(
          `
          UPDATE 
            Website as w, 
            WebsitePage as wp, 
            Page as p 
          SET 
            p.Show_In = "000" 
          WHERE
            w.UserId = ? AND
            wp.WebsiteId = w.WebsiteId AND
            p.PageId = wp.PageId AND
            p.Show_In = "100"`,
          [userId]
        );

        await queryRunner.manager.query(
          `UPDATE Website SET UserId = NULL WHERE UserId = ?`,
          [userId]
        );
      } else {
        await queryRunner.manager.query(
          `DELETE FROM Tag WHERE UserId = ? AND TagId <> 0`,
          [userId]
        );
        await queryRunner.manager.query(
          `DELETE FROM Website WHERE UserId = ? AND WebsiteId <> 0`,
          [userId]
        );
      }

      await queryRunner.manager.query(`DELETE FROM User WHERE UserId = ?`, [
        userId,
      ]);

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

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.query(`
      SELECT 
        u.UserId, u.Username, u.Type, u.Register_Date, u.Last_Login, 
        COUNT(distinct w.WebsiteId) as Websites
      FROM User as u
      LEFT OUTER JOIN Website as w ON w.UserId = u.UserId
      GROUP BY u.UserId`);

    return users;
  }

  async findAllFromMyMonitor(): Promise<User[]> {
    return this.userRepository.find({
      select: ["UserId", "Username", "Type", "Register_Date", "Last_Login"],
      where: { Type: "monitor" },
    });
  }

  async findInfo(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { UserId: userId },
    });

    if (user) {
      if (user.Type === "monitor") {
        user["websites"] = await this.userRepository.query(
          `SELECT * FROM Website WHERE UserId = ?`,
          [userId]
        );
      }

      delete user.Password;
      delete user.Unique_Hash;

      return user;
    } else {
      throw new InternalServerErrorException();
    }
  }

  findById(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { UserId: +id } });
  }

  findByUsername(username: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { Username: username } });
  }

  findNumberOfStudyMonitor(): Promise<number> {
    return this.userRepository.count({ where: { Type: "studies" } });
  }

  findNumberOfMyMonitor(): Promise<number> {
    return this.userRepository.count({ where: { Type: "monitor" } });
  }

  async findStudyMonitorUserTagByName(
    userId: number,
    name: string
  ): Promise<any> {
    return await this.tagRepository.findOne({
      where: { Name: name, UserId: userId },
    });
  }

  async createOne(
    user: User,
    tags: string[],
    websites: string[],
    transfer: boolean
  ): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertUser = await queryRunner.manager.save(user);

      if (user.Type === "monitor" && websites.length > 0) {
        await queryRunner.manager.update(
          Website,
          { WebsiteId: In(websites) },
          { UserId: insertUser.UserId }
        );

        if (transfer) {
          await queryRunner.manager.query(
            `UPDATE Website as w, WebsitePage as wp, Page as p, Evaluation as e
            SET 
              p.Show_In = "111",
              e.Show_To = "11" 
            WHERE
              w.WebsiteId IN (?) AND
              wp.WebsiteId = w.WebsiteId AND
              p.PageId = wp.PageId AND
              p.Show_In LIKE "101" AND
              e.PageId = p.PageId`,
            [websites]
          );
        }
      } else if (user.Type === "studies" && tags.length > 0) {
        const copyTags = await queryRunner.manager.query(
          `SELECT * FROM Tag WHERE TagId IN (?)`,
          [tags]
        );
        for (const tag of copyTags || []) {
          // Create user tag
          const newTag = new Tag();
          newTag.Name = tag.Name;
          newTag.UserId = insertUser.UserId;
          newTag.Creation_Date = new Date();

          const insertTag = await queryRunner.manager.save(newTag);

          // Create user tag websites
          const copyWebsites = await queryRunner.manager.query(
            `
            SELECT w.*
            FROM
              TagWebsite as tw,
              Website as w
            WHERE
              tw.TagId = ? AND
              w.WebsiteId = tw.WebsiteId  
          `,
            [tag.TagId]
          );

          for (const website of copyWebsites || []) {
            const newWebsite = new Website();
            newWebsite.Name = website.Name;
            newWebsite.StartingUrl = website.StaringUrl;
            newWebsite.UserId = insertUser.UserId;
            newWebsite.Creation_Date = new Date();

            const insertWebsite = await queryRunner.manager.save(newWebsite);

            await queryRunner.manager.query(
              `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`,
              [insertTag.TagId, insertWebsite.WebsiteId]
            );

            // Create user tag website pages connection
            const pages = await queryRunner.manager.query(
              `SELECT * FROM WebsitePage WHERE WebsiteId = ?`,
              [website[0].WebsiteId]
            );

            for (const page of pages || []) {
              await queryRunner.manager.query(
                `INSERT INTO WebsitePage (WebsiteId, PageId) VALUES (?, ?)`,
                [insertWebsite.WebsiteId, page.PageId]
              );
            }
          }
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

  async findType(username: string): Promise<any> {
    if (username === "admin") {
      return "nimda";
    }

    const user = await this.userRepository.findOne({
      where: { Username: username },
    });

    if (user) {
      return user.Type;
    } else {
      return null;
    }
  }

  async findAllWebsites(user: string): Promise<any> {
    const websites = await this.userRepository.query(
      `SELECT w.*, e.Short_Name as Entity, e.Long_Name as Entity2, u.Username as User 
        FROM 
          User as u,
          EntityWebsite as ew
          LEFT OUTER JOIN Website as w ON w.WebsiteId =  ew.WebsiteId
          LEFT OUTER JOIN Entity as e ON e.EntityId = ew.EntityId
        WHERE
          u.Username = ? AND
          w.UserId = u.UserId
        GROUP BY w.WebsiteId, w.StartingUrl`,
      [user]
    );

    return websites;
  }

  async findAllTags(user: string): Promise<any> {
    const tags = await this.userRepository.query(
      `SELECT t.*, COUNT(distinct tw.WebsiteId) as Websites, u.Username as User 
      FROM 
        User as u,
        Tag as t
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
      WHERE
        u.Username = ? AND
        t.UserId = u.UserId
      GROUP BY t.TagId`,
      [user]
    );

    return tags;
  }
}
