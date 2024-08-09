import { IsNotEmpty } from "class-validator";
export class WebsiteMyMonitorDto {
  @IsNotEmpty()
  website: string;
  userId: number;
}
