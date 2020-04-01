import { CrawlerService } from './crawler.service';
export declare class CrawlerController {
    private readonly crawlerService;
    constructor(crawlerService: CrawlerService);
    test(): Promise<any>;
    getAll(): Promise<any>;
    getConfig(): Promise<any>;
    setConfig(req: any): Promise<any>;
    isSubDomainDone(subDomain: string): Promise<any>;
    crawlPage(req: any): Promise<any>;
    deleteCrawl(req: any): Promise<any>;
    getCrawlResultsCrawlDomainID(crawlDomainId: string): Promise<any>;
}
