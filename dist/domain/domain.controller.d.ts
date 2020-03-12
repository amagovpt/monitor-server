import { DomainService } from './domain.service';
export declare class DomainController {
    private readonly domainService;
    constructor(domainService: DomainService);
    createDomain(req: any): Promise<any>;
    updateDomain(req: any): Promise<any>;
    getAllDomains(): Promise<any>;
    getAllOfficialDomains(): Promise<any>;
    getAllDomainPages(domain: string, user: string): Promise<any>;
    checkIfDomainExists(url: string): Promise<any>;
    getMyMonitorUserWebsiteDomain(req: any, website: string): Promise<any>;
    getStudyMonitorUserTagWebsiteDomain(req: any, tag: string, website: string): Promise<any>;
}
