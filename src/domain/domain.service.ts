import { Injectable } from '@nestjs/common';
import { getManager } from 'typeorm';

@Injectable()
export class DomainService {

  async findAll(): Promise<any> {
    const manager = getManager();
    const domains = await manager.query(`SELECT d.*, COUNT(distinct p.PageId) as Pages, u.Username as User
      FROM
        Domain as d
        LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
        LEFT OUTER JOIN Page as p ON p.PageId = dp.PageId AND p.Show_In LIKE "1%%"
        LEFT OUTER JOIN Website as w ON w.WebsiteId = d.WebsiteId
        LEFT OUTER JOIN User as u ON u.UserId = w.UserId
      WHERE
        (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) != 'studies')) AND
        w.Deleted = "0"
      GROUP BY d.DomainId`);
    return domains;
  }
}
