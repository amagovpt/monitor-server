import { IsNotEmpty } from "class-validator";
export class WebsitesIdDto {
  @IsNotEmpty()
  websitesId: number[];

  @IsNotEmpty()
  option: string;
}
