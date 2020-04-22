import { PageService } from './page.service';
export declare class PageController {
    private readonly pageService;
    constructor(pageService: PageService);
    reEvaluatePage(req: any): Promise<any>;
    getNumberOfPagesWaitingForEvaluation(): Promise<any>;
    getAllPages(): Promise<any>;
    getAllMyMonitorUserWebsitePages(req: any, website: string): Promise<any>;
    createMyMonitorUserWebsitePages(req: any): Promise<any>;
    removeMyMonitorUserWebsitePages(req: any): Promise<any>;
    getStudyMonitorUserTagWebsitePages(req: any, tag: string, website: string): Promise<any>;
    addPages(req: any): Promise<any>;
    evaluatePage(req: any): Promise<any>;
    evaluateMyMonitorWebsitePage(req: any): Promise<any>;
    evaluateStudyMonitorTagWebsitePage(req: any): Promise<any>;
    createStudyMonitorUserTagWebsitePages(req: any): Promise<any>;
    removeStudyMonitorUserTagWebsitePages(req: any): Promise<any>;
    update(req: any): Promise<any>;
    delete(req: any): Promise<any>;
    importPage(req: any): Promise<any>;
}
