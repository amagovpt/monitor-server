import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, getManager, In } from 'typeorm';
import { User } from './user.entity';
import { Tag } from '../tag/tag.entity';
import { Website } from '../website/website.entity';
import { comparePasswordHash, generatePasswordHash } from '../lib/security';

@Injectable()
export class UserService {
  
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    private readonly connection: Connection
  ) {}

  async changePassword(userId: number, password: string, newPassword: string): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const user = await this.userRepository.findOne({ where: { UserId: userId } });
      if (user && await comparePasswordHash(password, user.Password)) {
        const newPasswordHash = await generatePasswordHash(newPassword);
        await queryRunner.manager.update(User, { UserId: userId }, { Password: newPasswordHash });
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

  async findAllNonAdmin(): Promise<User[]> {
    const manager = getManager();
    const users = await manager.query(`
      SELECT 
        u.UserId, u.Username, u.Type, u.Register_Date, u.Last_Login, 
        COUNT(distinct w.WebsiteId) as Websites
      FROM User as u
      LEFT OUTER JOIN Website as w ON w.UserId = u.UserId
      WHERE LOWER(u.Type) != "nimda"
      GROUP BY u.UserId`);

    return users;
  }

  async findAllFromMyMonitor(): Promise<User[]> {
    return this.userRepository.find({ 
      select: ['UserId', 'Username', 'Type', 'Register_Date', 'Last_Login'], 
      where: { Type: 'monitor' } 
    });
  }

  findById(id: string): Promise<User> {
    return this.userRepository.findOne(id);
  }

  findByUsername(username: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { Username: username } });
  }

  findNumberOfStudyMonitor(): Promise<number> {
    return this.userRepository.count({ Type: 'studies' });
  }

  findNumberOfMyMonitor(): Promise<number> {
    return this.userRepository.count({ Type: 'monitor' });
  }

  async findStudyMonitorUserTagByName(userId: number, name: string): Promise<any> {
    return await this.tagRepository.findOne({ where: { Name: name, UserId: userId }});
  }

  async createOne(user: User, websites: string[], transfer: boolean): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertUser = await queryRunner.manager.save(user);

      if (user.Type === 'monitor' && websites.length > 0) {
        await queryRunner.manager.update(Website, { WebsiteId: In(websites) }, { UserId: insertUser.UserId });

        if (transfer) {
          await queryRunner.manager.query(`UPDATE Domain as d, DomainPage as dp, Page as p, Evaluation as e
            SET 
              p.Show_In = "111",
              e.Show_To = "11" 
            WHERE
              d.WebsiteId IN (?) AND
              dp.DomainId = d.DomainId AND
              p.PageId = dp.PageId AND
              p.Show_In LIKE "101" AND
              e.PageId = p.PageId`, [websites]);
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

  async findType(username: string): Promise<any> {
    if (username === 'admin') {
      return 'nimda';
    }

    const user = await this.userRepository.findOne({ where: { Username: username }});

    if (user) {
      return user.Type;
    } else {
      return null;
    }
  }

  async findAllWebsites(user: string): Promise<any> {
    const manager = getManager();

    const websites = await manager.query(
      `SELECT w.*, d.Url, e.Short_Name as Entity, e.Long_Name as Entity2, u.Username as User 
        FROM 
          Website as w
          LEFT OUTER JOIN Entity as e ON e.EntityId = w.EntityId,
          User as u,
          Domain as d
        WHERE
          LOWER(u.Username) = ? AND
          w.UserId = u.UserId AND 
          d.WebsiteId = w.WebsiteId AND
          d.Active = "1"
        GROUP BY w.WebsiteId, d.Url`, [user.toLowerCase()]);

    return websites;
  }

  async findAllTags(user: string): Promise<any> {
    const manager = getManager();

    const tags = await manager.query(
      `SELECT t.*, COUNT(distinct tw.WebsiteId) as Websites, u.Username as User 
      FROM 
        User as u,
        Tag as t
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
      WHERE
        LOWER(u.Username) = ? AND
        t.UserId = u.UserId
      GROUP BY t.TagId`, [user.toLowerCase()]);

    return tags;
  }
}