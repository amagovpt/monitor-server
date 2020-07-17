import { CrawlerService } from './crawler.service';
export declare class CrawlerController {
    private readonly crawlerService;
    constructor(crawlerService: CrawlerService);
    getAll(): Promise<any>;
    getConfig(): Promise<any>;
    setConfig(req: any): Promise<any>;
    isSubDomainDone(subDomain: string): Promise<any>;
    crawlPage(req: any): Promise<any>;
    crawlUserPage(req: any): Promise<any>;
    checkCrawlUserPage(req: any): Promise<any>;
    getCrawlUserPageResults(req: any): Promise<any>;
    deleteCrawlUserPage(req: any): Promise<any>;
    crawlStudiesUserPage(req: any): Promise<any>;
    checkStudiesCrawlUserPage(req: any): Promise<any>;
    getCrawlStudiesUserTagWebsites(tagName: string, req: any): Promise<any>;
    getCrawlStudiesUserPageResults(req: any): Promise<any>;
    deleteCrawlStudiesUserPage(req: any): Promise<any>;
    deleteCrawl(req: any): Promise<any>;
    getCrawlResultsCrawlDomainID(crawlDomainId: string): Promise<any>;
}
