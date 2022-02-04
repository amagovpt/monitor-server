export class UsabilityChecklist {
    public monitorServerId: number
    public websiteId: number
    public urls: Array<string>
    public pageId: number
    public createdAt: Date
    public form: IChecklist[]
}

export interface IChecklist {
    type: EChecklistType;
    items: Array<ICheckboxItem>
}

export enum EChecklistType {
    FUNCTIONAL_ASPECTS,
    CONTENT,
    TRANSACTION,
}

export interface ICheckboxItem {
    identifier: string
    checkbox: ECheckboxAnswer
    note: string;
    resources: Array<IResource>
    images: Array<IImage>
}

export enum ECheckboxAnswer {
    NA,
    S,
    N,
}

interface IResource {
    url: string;
    identifier: string;
}

export interface IImage {
    photoName: string;
    base64: string;
    identifier: number;
}

