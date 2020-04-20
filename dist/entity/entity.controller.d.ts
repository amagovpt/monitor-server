import { EntityService } from './entity.service';
export declare class EntityController {
    private readonly entityService;
    constructor(entityService: EntityService);
    reEvaluateWebsitePages(req: any): Promise<any>;
    getAllEntities(): Promise<any>;
    getEntityInfo(entityId: number): Promise<any>;
    createEntity(req: any): Promise<any>;
    updateEntity(req: any): Promise<any>;
    deleteEntity(req: any): Promise<any>;
    checkIfShortNameExists(shortName: string): Promise<any>;
    checkIfLongNameExists(longName: string): Promise<any>;
    getListOfEntityWebsites(entity: string): Promise<any>;
}
