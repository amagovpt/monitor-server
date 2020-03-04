import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, getManager, IsNull } from 'typeorm';
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

  findByTagName(tagName: string): Promise<Tag | undefined> {
    return this.tagRepository.findOne({ where: { Name: tagName } });
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
}
