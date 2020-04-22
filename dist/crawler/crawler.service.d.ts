import { Connection, Repository } from 'typeorm';
import { NestCrawlerService } from 'nest-crawler';
import { CrawlDomain, CrawlPage } from './crawler.entity';
export declare class CrawlerService {
    private readonly crawlDomainRepository;
    private readonly crawlPageRepository;
    private readonly newCrawler;
    private readonly connection;
    constructor(crawlDomainRepository: Repository<CrawlDomain>, crawlPageRepository: Repository<CrawlPage>, newCrawler: NestCrawlerService, connection: Connection);
    crawl(url: string): void;
    private crawler;
    findAll(): Promise<any>;
    getConfig(): any;
    setConfig(maxDepth: number, maxPages: number): any;
    isCrawlSubDomainDone(subDomain: string): Promise<any>;
    crawlDomain(subDomain: string, domain: string, domainId: number, maxDepth: number, maxPages: number): Promise<any>;
    getCrawlResultsCrawlDomainID(crawlDomainID: number): Promise<any>;
    delete(crawlDomainId: number): Promise<any>;
}
