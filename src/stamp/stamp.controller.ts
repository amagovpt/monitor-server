import { Controller, Post, Request, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import * as SqlString from "sqlstring";
import { StampService } from "./stamp.service";
import { success, error } from "src/lib/response";

@Controller("stamp")
export class StampController {
  constructor(private readonly stampService: StampService) {}

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("all")
  async generateAllWebsitesDigitalStamp(): Promise<any> {
    const errors = await this.stampService.generateAllWebsitesDigitalStamp();
    return errors.length === 0 ? success(true) : error(errors, false);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("websites")
  async generateWebsiteDigitalStamp(@Request() req: any): Promise<any> {
    const websitesId = JSON.parse(req.body.websitesId);
    return success(
      await this.stampService.generateWebsitesDigitalStamp(websitesId)
    );
  }
}
