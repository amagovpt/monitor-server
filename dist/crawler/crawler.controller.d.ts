import { CrawlerService } from './crawler.service';
export declare class CrawlerController {
    private readonly crawlerService;
    constructor(crawlerService: CrawlerService);
    getAll(): Promise<any>;
    getConfig(): Promise<any>;
}
