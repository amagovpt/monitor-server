import { Connection, Repository } from 'typeorm';
import { CrawlDomain, CrawlPage } from './crawler.entity';
export declare class CrawlerService {
    private readonly crawlDomainRepository;
    private readonly crawlPageRepository;
    private readonly connection;
    constructor(crawlDomainRepository: Repository<CrawlDomain>, crawlPageRepository: Repository<CrawlPage>, connection: Connection);
    findAll(): Promise<any>;
    getConfig(): any;
}
