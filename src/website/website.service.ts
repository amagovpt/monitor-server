import { Injectable } from '@nestjs/common';
import { getManager } from 'typeorm';

@Injectable()
export class WebsiteService {

  async findAllWithoutUser(): Promise<any> {
    const manager = getManager();
    const websites = await manager.query(`SELECT * FROM Website WHERE UserId IS NULL AND Deleted = "0"`);
    return websites;
  }
}
