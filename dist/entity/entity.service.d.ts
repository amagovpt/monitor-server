import { Connection, Repository } from 'typeorm';
import { EntityTable } from './entity.entity';
export declare class EntityService {
    private readonly entityRepository;
    private readonly connection;
    constructor(entityRepository: Repository<EntityTable>, connection: Connection);
    findAll(): Promise<any>;
    findInfo(entityId: number): Promise<any>;
    findByShortName(shortName: string): Promise<any>;
    findByLongName(longName: string): Promise<any>;
    findAllWebsites(entity: string): Promise<any>;
    createOne(entity: EntityTable, websites: string[]): Promise<boolean>;
    update(entityId: number, shortName: string, longName: string, websites: number[], defaultWebsites: number[]): Promise<any>;
    delete(entityId: number): Promise<any>;
}
