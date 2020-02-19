import { TagService } from './tag.service';
export declare class TagController {
    private readonly tagService;
    constructor(tagService: TagService);
    createTag(req: any): Promise<any>;
    checkIfTagNameExists(tagName: string): Promise<boolean>;
    getAllTags(): Promise<any>;
    getAllOfficialTags(): Promise<any>;
}
