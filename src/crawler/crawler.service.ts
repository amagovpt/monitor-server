import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, getManager } from 'typeorm';
import { CrawlDomain, CrawlPage } from './crawler.entity';
import { readFileSync } from 'fs';

@Injectable()
export class CrawlerService {

  constructor(
    @InjectRepository(CrawlDomain)
    private readonly crawlDomainRepository: Repository<CrawlDomain>,
    @InjectRepository(CrawlPage)
    private readonly crawlPageRepository: Repository<CrawlPage>,
    private readonly connection: Connection
  ) {}

  findAll(): Promise<any> {
    return this.crawlDomainRepository.find();
  }
  
  getConfig(): any {
    const content = readFileSync(__dirname + '/../../public/crawlerConfig.json');
    const config = JSON.parse(content.toString());
    return config;
  }
}
