import { Connection, Repository } from 'typeorm';
import { Domain } from './domain.entity';
export declare class DomainService {
    private readonly domainRepository;
    private readonly connection;
    constructor(domainRepository: Repository<Domain>, connection: Connection);
    findAll(): Promise<any>;
    findAllOfficial(): Promise<any>;
    findByUrl(url: string): Promise<any>;
    findMyMonitorUserWebsiteDomain(userId: number, website: string): Promise<any>;
    findStudyMonitorUserTagWebsiteDomain(userId: number, tag: string, website: string): Promise<any>;
}
