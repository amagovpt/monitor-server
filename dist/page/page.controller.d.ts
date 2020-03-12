import { PageService } from './page.service';
export declare class PageController {
    private readonly pageService;
    constructor(pageService: PageService);
    getAllPages(): Promise<any>;
    getAllMyMonitorUserWebsitePages(req: any, website: string): Promise<any>;
    createMyMonitorUserWebsitePages(req: any): Promise<any>;
    removeMyMonitorUserWebsitePages(req: any): Promise<any>;
    getStudyMonitorUserTagWebsitePages(req: any, tag: string, website: string): Promise<any>;
    createStudyMonitorUserTagWebsitePages(req: any): Promise<any>;
    removeStudyMonitorUserTagWebsitePages(req: any): Promise<any>;
    update(req: any): Promise<any>;
    delete(req: any): Promise<any>;
    importPage(req: any): Promise<any>;
}
