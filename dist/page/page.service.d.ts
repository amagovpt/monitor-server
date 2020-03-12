import { Connection, Repository } from 'typeorm';
import { Website } from '../website/website.entity';
import { Page } from './page.entity';
import { EvaluationService } from '../evaluation/evaluation.service';
export declare class PageService {
    private readonly websiteRepository;
    private readonly pageRepository;
    private readonly connection;
    private readonly evaluationService;
    constructor(websiteRepository: Repository<Website>, pageRepository: Repository<Page>, connection: Connection, evaluationService: EvaluationService);
    findUserType(username: string): Promise<any>;
    findAll(): Promise<any>;
    getObservatoryData(): Promise<any>;
    findAllFromMyMonitorUserWebsite(userId: number, websiteName: string): Promise<any>;
    findStudyMonitorUserTagWebsitePages(userId: number, tag: string, website: string): Promise<any>;
    createMyMonitorUserWebsitePages(userId: number, website: string, domain: string, uris: string[]): Promise<any>;
    removeMyMonitorUserWebsitePages(userId: number, website: string, pagesIds: number[]): Promise<any>;
    createStudyMonitorUserTagWebsitePages(userId: number, tag: string, website: string, domain: string, uris: string[]): Promise<any>;
    removeStudyMonitorUserTagWebsitePages(userId: number, tag: string, website: string, pagesId: number[]): Promise<any>;
    update(pageId: number, checked: boolean): Promise<any>;
    delete(pages: number[]): Promise<any>;
    import(pageId: number, type: string): Promise<any>;
    importStudy(pageId: number, username: string, tagName: string, website: string): Promise<any>;
}
