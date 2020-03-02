import { Connection, Repository } from 'typeorm';
import { Website } from '../website/website.entity';
import { Page } from './page.entity';
import { EvaluationService } from 'src/evaluation/evaluation.service';
export declare class PageService {
    private readonly websiteRepository;
    private readonly pageRepository;
    private readonly connection;
    private readonly evaluationService;
    constructor(websiteRepository: Repository<Website>, pageRepository: Repository<Page>, connection: Connection, evaluationService: EvaluationService);
    findAll(): Promise<any>;
    getObservatoryData(): Promise<any>;
    findAllFromMyMonitorUserWebsite(userId: number, websiteName: string): Promise<any>;
    createMyMonitorUserWebsitePages(userId: number, website: string, domain: string, uris: string[]): Promise<any>;
    removeMyMonitorUserWebsitePages(userId: number, website: string, pagesIds: number[]): Promise<any>;
}
