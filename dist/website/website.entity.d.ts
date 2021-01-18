import { Tag } from "../tag/tag.entity";
export declare class Website {
    WebsiteId: number;
    EntityId: number;
    UserId: number;
    Name: string;
    Declaration: number;
    Stamp: number;
    Creation_Date: any;
    Deleted: number;
    Tags: Tag[];
}
