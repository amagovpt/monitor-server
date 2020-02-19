import { Injectable } from '@nestjs/common';
import { getManager } from 'typeorm';

@Injectable()
export class EntityService {

  constructor() {}

  async findAll(): Promise<any> {
    const manager = getManager();
    const entities = await manager.query(`SELECT e.*, COUNT(distinct w.WebsiteId) as Websites 
      FROM 
        Entity as e 
        LEFT OUTER JOIN Website as w ON w.EntityId = e.EntityId
      GROUP BY e.EntityId`);
    return entities;
  }
}
