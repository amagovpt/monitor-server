import { IsNotEmpty } from "class-validator";
export class ImportWebsiteMyMonitorDto {
  @IsNotEmpty()
  websiteId: number;
  newWebsiteName: string;
}
