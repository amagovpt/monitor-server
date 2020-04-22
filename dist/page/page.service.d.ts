import { Connection, Repository } from 'typeorm';
import { Website } from '../website/website.entity';
import { Page } from './page.entity';
export declare class PageService {
    private readonly websiteRepository;
    private readonly pageRepository;
    private readonly connection;
    constructor(websiteRepository: Repository<Website>, pageRepository: Repository<Page>, connection: Connection);
    findUserType(username: string): Promise<any>;
    findAllInEvaluationList(): Promise<number>;
    findAll(): Promise<any>;
    getObservatoryData(): Promise<any>;
    findAllFromMyMonitorUserWebsite(userId: number, websiteName: string): Promise<any>;
    findStudyMonitorUserTagWebsitePages(userId: number, tag: string, website: string): Promise<any>;
    findPageFromUrl(url: string): Promise<any>;
    isPageFromStudyMonitorUser(userId: number, tag: string, website: string, pageId: number): Promise<any>;
    isPageFromMyMonitorUser(userId: number, pageId: number): Promise<any>;
    addPageToEvaluate(url: string, showTo?: string, userId?: number | null): Promise<boolean>;
    addPages(domainId: number, uris: string[], observatory: string[]): Promise<boolean>;
    createMyMonitorUserWebsitePages(userId: number, website: string, domain: string, uris: string[]): Promise<any>;
    removeMyMonitorUserWebsitePages(userId: number, website: string, pagesIds: number[]): Promise<any>;
    createStudyMonitorUserTagWebsitePages(userId: number, tag: string, website: string, domain: string, uris: string[]): Promise<any>;
    removeStudyMonitorUserTagWebsitePages(userId: number, tag: string, website: string, pagesId: number[]): Promise<any>;
    update(pageId: number, checked: boolean): Promise<any>;
    delete(pages: number[]): Promise<any>;
    import(pageId: number, type: string): Promise<any>;
    importStudy(pageId: number, username: string, tagName: string, website: string): Promise<any>;
}
