import { Connection, Repository } from 'typeorm';
import { Website } from './website.entity';
export declare class WebsiteService {
    private readonly websiteRepository;
    private readonly connection;
    constructor(websiteRepository: Repository<Website>, connection: Connection);
    findAll(): Promise<any>;
    findAllOfficial(): Promise<any>;
    findByName(name: string): Promise<any>;
    findAllWithoutUser(): Promise<any>;
    findAllWithoutEntity(): Promise<any>;
    createOne(website: Website, domain: string, tags: string[]): Promise<boolean>;
}
