import { IsNotEmpty } from 'class-validator';
export class UpdateWebsiteDto {
    @IsNotEmpty()
    WebsiteId: number;

    @IsNotEmpty()
    UserId: number;

    @IsNotEmpty()
    oldUserId: number;

    @IsNotEmpty()
    Name: string;

    @IsNotEmpty()
    StartingUrl: string;

    Declaration: number;

    Stamp: number;

    Creation_Date: any;

    entities:number[];

    tags: number[];

    transfer: boolean;

    defaultEntities: number[];

    defaultTags: number[];
}