import { DomainService } from './domain.service';
export declare class DomainController {
    private readonly domainService;
    constructor(domainService: DomainService);
    getAllDomains(): Promise<any>;
    getAllOfficialDomains(): Promise<any>;
    checkIfDomainExists(url: string): Promise<any>;
}
