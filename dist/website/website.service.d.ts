import { Connection, Repository } from 'typeorm';
import { Website } from './website.entity';
import { Tag } from '../tag/tag.entity';
import { EvaluationService } from '../evaluation/evaluation.service';
export declare class WebsiteService {
    private readonly websiteRepository;
    private readonly tagRepository;
    private readonly connection;
    private readonly evaluationService;
    constructor(websiteRepository: Repository<Website>, tagRepository: Repository<Tag>, connection: Connection, evaluationService: EvaluationService);
    findAll(): Promise<any>;
    findAllOfficial(): Promise<any>;
    findByName(name: string): Promise<any>;
    findAllWithoutUser(): Promise<any>;
    findAllWithoutEntity(): Promise<any>;
    findAllFromMyMonitorUser(userId: number): Promise<any>;
    findAllFromStudyMonitorUserTag(userId: number, tagName: string): Promise<any>;
    findAllFromStudyMonitorUserOtherTagsWebsites(userId: number, tagName: string): Promise<any>;
    findStudyMonitorUserTagWebsiteByName(userId: number, tag: string, websiteName: string): Promise<any>;
    findStudyMonitorUserTagWebsiteByDomain(userId: number, tag: string, domain: string): Promise<any>;
    linkStudyMonitorUserTagWebsite(userId: number, tag: string, websitesId: number[]): Promise<any>;
    createStudyMonitorUserTagWebsite(userId: number, tag: string, websiteName: string, domain: string, pages: string[]): Promise<any>;
    removeStudyMonitorUserTagWebsite(userId: number, tag: string, websitesId: number[]): Promise<any>;
    findNumberOfStudyMonitor(): Promise<number>;
    findNumberOfMyMonitor(): Promise<number>;
    findNumberOfObservatory(): Promise<number>;
    createOne(website: Website, domain: string, tags: string[]): Promise<boolean>;
}
