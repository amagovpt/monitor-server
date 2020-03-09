import { Connection, Repository } from 'typeorm';
import { Tag } from './tag.entity';
export declare class TagService {
    private readonly tagRepository;
    private readonly connection;
    constructor(tagRepository: Repository<Tag>, connection: Connection);
    findByTagName(tagName: string): Promise<Tag | undefined>;
    findAll(): Promise<any>;
    findAllOfficial(): Promise<any>;
    findNumberOfStudyMonitor(): Promise<number>;
    findNumberOfObservatory(): Promise<number>;
    findAllFromStudyMonitorUser(userId: number): Promise<any>;
    findStudyMonitorUserTagData(userId: number, tag: string): Promise<any>;
    findStudyMonitorUserTagWebsitesPagesData(userId: number, tag: string, website: string): Promise<any>;
    createOne(tag: Tag, websites: number[]): Promise<boolean>;
    createUserTag(tag: Tag, type: string, tagsId: number[]): Promise<any>;
    removeUserTag(userId: number, tagsId: number[]): Promise<any>;
}
