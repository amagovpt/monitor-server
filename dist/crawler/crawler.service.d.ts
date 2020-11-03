import { Connection, Repository } from 'typeorm';
import { CrawlDomain } from './crawler.entity';
export declare class CrawlerService {
    private readonly crawlDomainRepository;
    private readonly connection;
    private isCrawling;
    constructor(crawlDomainRepository: Repository<CrawlDomain>, connection: Connection);
    nestCrawlUser(): Promise<void>;
    private crawl;
    private crawler;
    findAll(): Promise<any>;
    getConfig(): any;
    setConfig(maxDepth: number, maxPages: number): any;
    isCrawlSubDomainDone(subDomain: string): Promise<any>;
    isUserCrawlerDone(userId: number, domainId: number): Promise<boolean>;
    getUserCrawlResults(userId: number, domainId: number): Promise<boolean>;
    getUserTagWebsitesCrawlResults(userId: number, tagName: string): Promise<any>;
    deleteUserCrawler(userId: number, domainId: number): Promise<boolean>;
    crawlDomain(userId: number, subDomain: string, domain: string, domainId: number, maxDepth: number, maxPages: number): Promise<any>;
    getCrawlResultsCrawlDomainID(crawlDomainID: number): Promise<any>;
    delete(crawlDomainId: number): Promise<any>;
    getDomainId(userId: number, domain: string): Promise<number>;
}
