import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, getManager } from 'typeorm';
import { Website } from './website.entity';
import { Domain } from '../domain/domain.entity';

@Injectable()
export class WebsiteService {

  constructor(
    @InjectRepository(Website)
    private readonly websiteRepository: Repository<Website>,
    private readonly connection: Connection
  ) {}

  async findAll(): Promise<any> {
    const manager = getManager();
    const websites = await manager.query(`SELECT w.*, e.Short_Name as Entity, e.Long_Name as Entity2, u.Username as User, u.Type as Type, d.DomainId
      FROM Website as w
      LEFT OUTER JOIN Entity as e ON e.EntityId = w.EntityId
      LEFT OUTER JOIN User as u ON u.UserId = w.UserId
      LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = "1"
      WHERE 
        (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) != 'studies')) AND
        w.Deleted = "0"
      GROUP BY w.WebsiteId, d.DomainId`);
    return websites;
  }

  async findAllOfficial(): Promise<any> {
    const manager = getManager();
    const websites = await manager.query(`SELECT distinct w.* 
      FROM 
        Website as w, 
        User as u 
      WHERE 
        (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) != 'studies')) AND
        w.Deleted = "0"`);
    return websites;
  }

  async findByName(name: string): Promise<any> {
    return this.websiteRepository.findOne({ where: { Name: name }});
  }

  async findAllWithoutUser(): Promise<any> {
    const manager = getManager();
    const websites = await manager.query(`SELECT * FROM Website WHERE UserId IS NULL AND Deleted = "0"`);
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
        (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) != 'studies'))`);
    return websites;
  }

  async createOne(website: Website, domain: string, tags: string[]): Promise<boolean> {
    domain = domain.replace('https://', '').replace('http://', '').replace('www.', '');

    if (domain.endsWith('/')) {
      domain = domain.substring(0, domain.length - 1);
    }

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const websites = await queryRunner.manager.query(`
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
        `, [domain]);

      let websiteId = -1;
      
      if (websites.length > 0) {
        websiteId = websites[0].WebsiteId;

        const values = { Name: website.Name, Deleted: 0 };
        if (website.EntityId !== null) {
          values['EntityId'] = website.EntityId;
        }

        if (website.UserId !== null) {
          values['UserId'] = website.UserId;
        }

        await queryRunner.manager.update(Website, { WebsiteId: websiteId }, values);

        if (websites[0].Active === 0) {
          await queryRunner.manager.update(Domain, { WebsiteId: websiteId, Active: 1 }, { Active: 0, End_Date: website.Creation_Date });
          await queryRunner.manager.update(Domain, { WebsiteId: websiteId, Url: domain }, { Active: 1, End_Date: null });
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

      for (const tag of tags || []) {
        await queryRunner.manager.query(`INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`, [tag, websiteId]);
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
