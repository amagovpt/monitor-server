import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, getManager } from 'typeorm';
import { EntityTable } from './entity.entity';
import { Website } from '../website/website.entity';

@Injectable()
export class EntityService {

  constructor(
    @InjectRepository(EntityTable)
    private readonly entityRepository: Repository<EntityTable>,
    private readonly connection: Connection
  ) {}

  async findAll(): Promise<any> {
    const manager = getManager();
    const entities = await manager.query(`SELECT e.*, COUNT(distinct w.WebsiteId) as Websites 
      FROM 
        Entity as e 
        LEFT OUTER JOIN Website as w ON w.EntityId = e.EntityId
      GROUP BY e.EntityId`);
    return entities;
  }

  async findByShortName(shortName: string): Promise<any> {
    return this.entityRepository.findOne({ where: { Short_Name: shortName } });
  }

  async findByLongName(longName: string): Promise<any> {
    return this.entityRepository.findOne({ where: { Long_Name: longName } });
  }

  async createOne(entity: EntityTable, websites: string[]): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertEntity = await queryRunner.manager.save(entity);

      for (const websiteId of websites || []) {
        await queryRunner.manager.update(Website, { WebsiteId: websiteId }, { EntityId: insertEntity.EntityId });
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
}
