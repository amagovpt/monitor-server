import { Repository } from 'typeorm';
import { Page } from './page.entity';
export declare class PageService {
    private readonly pageRepository;
    constructor(pageRepository: Repository<Page>);
    createOne(): Promise<any>;
    findAll(): Promise<any>;
    getObservatoryData(): Promise<any>;
}
