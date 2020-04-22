import { StampService } from './stamp.service';
export declare class StampController {
    private readonly stampService;
    constructor(stampService: StampService);
    generateAllWebsitesDigitalStamp(): Promise<any>;
    generateWebsiteDigitalStamp(req: any): Promise<any>;
}
