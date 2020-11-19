import { Website } from "./website";
export declare class Tag {
    id: number;
    rank: number;
    name: string;
    creationDate: Date;
    websites: Array<Website>;
    nPages: number;
    nPagesWithoutErrors: number;
    entities: Array<string>;
    score: number;
    A: number;
    AA: number;
    AAA: number;
    frequencies: Array<number>;
    errors: any;
    recentPage: Date;
    oldestPage: Date;
    success: any;
    constructor(id: number, name: string, creationDate: Date);
    addWebsite(website: Website): void;
    getScore(): number;
    getTopTenErrors(): any;
    getPassedOccurrenceByWebsite(test: string): Array<number>;
    getErrorOccurrencesByWebsite(test: string): Array<number>;
}
