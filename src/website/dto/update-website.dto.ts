import { IsNotEmpty } from "class-validator";
export class UpdateWebsiteDto {
  @IsNotEmpty()
  websiteId: number;

  @IsNotEmpty()
  userId: number;

  @IsNotEmpty()
  oldUserId: number;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  startingUrl: string;

  declaration: number;

  stamp: number;

  declarationUpdateDate: any;

  stampUpdateDate: any;

  creation_Date: any;

  entities: number[];

  tags: number[];

  transfer: boolean;

  defaultEntities: number[];

  defaultTags: number[];
}
