import { Controller, Get, Post, UseGuards, UseInterceptors } from "@nestjs/common";
import { ObservatoryService } from "./observatory.service";
import { success, error } from "../lib/response";
import { AuthGuard } from "@nestjs/passport";
import { LoggingInterceptor } from "src/log/log.interceptor";
import { ApiBasicAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";


@ApiBasicAuth()
@ApiTags('observatory')
@ApiResponse({ status: 403, description: 'Forbidden' })
@Controller("observatory")
@UseInterceptors(LoggingInterceptor)
export class ObservatoryController {
  constructor(private readonly observatoryService: ObservatoryService) {}
  
  @ApiOperation({ summary: 'Get latest observatory data' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @Get()
  async getData(): Promise<any> {
    const data = await this.observatoryService.getObservatoryData();
    return success(data);
  }

  @ApiOperation({ summary: 'Generate observatory data' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
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
