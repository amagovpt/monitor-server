import { IsNotEmpty } from 'class-validator';
export class CreateWebsiteDto {
    WebsiteId: number;

    @IsNotEmpty()
    UserId: number;

    @IsNotEmpty()
    Name: string;

    @IsNotEmpty()
    StartingUrl: string;

    Declaration: number;

    Declaration_Update_Date: any;

    Stamp: number;

    Stamp_Update_Date: any;

    Creation_Date: any;

    entities:string[];

    tags: string[];
}