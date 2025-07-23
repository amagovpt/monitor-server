import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AppService } from "./app.service";
import { success } from "./lib/response";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("admin")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiOperation({ summary: "Get Observatory aggregated statistics" })
  @ApiResponse({
    status: 200,
    description: "Observatory statistics",
    type: Object,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("admin/stats/observatory")
  async getObservatoryStats(): Promise<any> {
    return success(await this.appService.getObservatoryStats());
  }

  @ApiOperation({ summary: "Get total aggregated statistics" })
  @ApiResponse({
    status: 200,
    description: "Total statistics",
    type: Object,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("admin/stats/totals")
  async getTotalStats(): Promise<any> {
    return success(await this.appService.getTotalStats());
  }

  @ApiOperation({ summary: "Get MyMonitor aggregated statistics" })
  @ApiResponse({
    status: 200,
    description: "MyMonitor statistics",
    type: Object,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("admin/stats/mymonitor")
  async getMyMonitorStats(): Promise<any> {
    return success(await this.appService.getMyMonitorStats());
  }
}
