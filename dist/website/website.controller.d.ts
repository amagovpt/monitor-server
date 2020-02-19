import { WebsiteService } from './website.service';
export declare class WebsiteController {
    private readonly websiteService;
    constructor(websiteService: WebsiteService);
    createUser(req: any): Promise<any>;
    getAllWebsites(): Promise<any>;
    getAllOfficialWebsites(): Promise<any>;
    getWebsitesWithoutUser(): Promise<any>;
    getWebsitesWithoutEntity(): Promise<any>;
    checkIfWebsiteExists(name: string): Promise<any>;
}
