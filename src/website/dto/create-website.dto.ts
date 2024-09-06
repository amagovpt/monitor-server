import { IsNotEmpty } from "class-validator";
export class CreateWebsiteDto {
  websiteId: number;

  @IsNotEmpty()
  userId: number;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  startingUrl: string;

  declaration: number;

  declaration_Update_Date: any;

  stamp: number;

  stamp_Update_Date: any;

  creation_Date: any;

  entities: string[];

  tags: string[];
}
