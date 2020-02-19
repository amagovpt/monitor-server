import { Connection, Repository } from 'typeorm';
import { EntityTable } from './entity.entity';
export declare class EntityService {
    private readonly entityRepository;
    private readonly connection;
    constructor(entityRepository: Repository<EntityTable>, connection: Connection);
    findAll(): Promise<any>;
    findByShortName(shortName: string): Promise<any>;
    findByLongName(longName: string): Promise<any>;
    createOne(entity: EntityTable, websites: string[]): Promise<boolean>;
}
