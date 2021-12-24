import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ObservatoryService } from "./observatory.service";
import { success, error } from "../lib/response";
import { AuthGuard } from "@nestjs/passport";

@Controller("observatory")
export class ObservatoryController {
  constructor(private readonly observatoryService: ObservatoryService) {}

  @Get()
  async getData(): Promise<any> {
    //const data = await this.observatoryService.getData();
    const data = await this.observatoryService.getObservatoryData();
    return success(data);
  }

  @UseGuards(AuthGuard("jwt-admin"))
  @Post("generate")
  async generateData(): Promise<any> {
    try {
      this.observatoryService.generateData(true);
      return success();
    } catch (err) {
      return error(err);
    }
  }
}
