import { PageService } from './page.service';
export declare class PageController {
    private readonly pageService;
    constructor(pageService: PageService);
    getAllPages(): Promise<any>;
    getAllMyMonitorUserWebsitePages(req: any, website: string): Promise<any>;
    createMyMonitorUserWebsitePages(req: any): Promise<any>;
    removeMyMonitorUserWebsitePages(req: any): Promise<any>;
}
