import { Website } from '../website/website.entity';
export declare class Tag {
    TagId: number;
    UserId: number;
    Name: string;
    Show_in_Observatorio: number;
    Creation_Date: any;
    Websites: Website[];
}
