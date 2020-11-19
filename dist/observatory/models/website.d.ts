import { Page } from "./page";
export declare class Website {
    id: number;
    rank: number;
    entity: string;
    name: string;
    domain: string;
    creationDate: Date;
    pages: Array<Page>;
    score: number;
    A: number;
    AA: number;
    AAA: number;
    frequencies: Array<number>;
    errors: any;
    recentPage: Date;
    oldestPage: Date;
    success: any;
    constructor(id: number, entity: string, name: string, domain: string, creationDate: Date);
    addPage(pageId: number, uri: string, creationDate: Date, evaluationId: number, title: string, score: number, errors: any, tot: any, A: number, AA: number, AAA: number, evaluationDate: Date): void;
    getScore(): number;
    getAllScores(): Array<number>;
    getTopTenBestPractices(): any;
    getTopTenErrors(): any;
    getPassedOccurrencesByPage(test: string): Array<number>;
    getErrorOccurrencesByPage(test: string): Array<number>;
}
