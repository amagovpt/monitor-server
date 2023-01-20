import { Controller, Get, Post, UseGuards, UseInterceptors } from "@nestjs/common";
import { ObservatoryService } from "./observatory.service";
import { success, error } from "../lib/response";
import { AuthGuard } from "@nestjs/passport";
import { LoggingInterceptor } from "src/log/log.interceptor";

@Controller("observatory")
@UseInterceptors(LoggingInterceptor)
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
