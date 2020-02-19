import { PageService } from '../page/page.service';
export declare class ObservatoryController {
    private readonly pageService;
    constructor(pageService: PageService);
    getData(): Promise<any>;
}
