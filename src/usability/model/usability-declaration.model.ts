import {UsabilityDeclaration, UsabilityDeclarationWebsiteName} from "../declaration/usability-declaration.entity";

export class UsabilityDeclarationModel {
    public id: number
    public websiteName: string
    public processed: boolean
    public compliance: UsabilityDeclarationCompliance
    public createdAt: Date
    public updatedAt: Date

    constructor(
        id: number,
        websiteName: string,
        processed: boolean,
        compliance: UsabilityDeclarationCompliance,
        createdAt: Date,
        updatedAt?: Date)
    {
        this.id = id
        this.websiteName = websiteName
        this.processed = processed
        this.compliance = compliance
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }

    public static toModel(entity: UsabilityDeclarationWebsiteName) {
        return new UsabilityDeclarationModel(
            entity.UsabilityDeclarationId,
            entity.Name,
            entity.Processed,
            {
                functionalAspects: entity.FunctionalAspectsCompliance,
                content: entity.ContentCompliance,
                transaction: entity.TransactionCompliance
            },
            entity.CreatedAt,
            entity.UpdatedAt);
    }
}

export class UsabilityDeclarationSyncModel {
    public id: number
    public pageId: number
    public urls: string

    constructor(usabilityDeclaration: UsabilityDeclaration) {
        this.id = usabilityDeclaration.UsabilityDeclarationId
        this.pageId = usabilityDeclaration.PageId
        this.urls = usabilityDeclaration.DeclarationUrls;
    }
}

export interface UsabilityDeclarationCompliance {
    functionalAspects: number
    content: number
    transaction: number
}
