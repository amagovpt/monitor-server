import { EntityService } from './entity.service';
export declare class EntityController {
    private readonly entityService;
    constructor(entityService: EntityService);
    getAllEntities(): Promise<any>;
    createEntity(req: any): Promise<any>;
    checkIfShortNameExists(shortName: string): Promise<any>;
    checkIfLongNameExists(longName: string): Promise<any>;
    getListOfEntityWebsites(entity: string): Promise<any>;
}
