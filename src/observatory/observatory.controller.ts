import { Controller, Get } from "@nestjs/common";
import { ObservatoryService } from "./observatory.service";
import { success } from "../lib/response";

@Controller("observatory")
export class ObservatoryController {
  constructor(private readonly observatoryService: ObservatoryService) {}

  @Get()
  async getData(): Promise<any> {
    //const data = await this.observatoryService.getData();
    const data = await this.observatoryService.getObservatoryData();
    return success(data);
  }
}
