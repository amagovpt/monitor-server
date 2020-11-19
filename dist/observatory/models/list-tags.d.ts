import { Tag } from "./tag";
import { Website } from "./website";
export declare class ListTags {
    tags: Array<Tag>;
    nEntities: number;
    nWebsites: number;
    nPages: number;
    nPagesWithoutErrors: number;
    score: number;
    A: number;
    AA: number;
    AAA: number;
    frequencies: Array<number>;
    errors: any;
    success: any;
    recentPage: Date;
    oldestPage: Date;
    constructor(tags: Array<Tag>);
    getScore(): number;
    getTopFiveErrors(): any;
    getTopFiveBestPractices(): any;
    getPassedAndWarningOccurrenceByTag(test: string): Array<number>;
    getErrorOccurrenceByTag(test: string): Array<number>;
    getTag(id: number): Tag;
    getWebsite(tagId: number, websiteId: number): Website;
}
