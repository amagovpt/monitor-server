import { Body, Controller, Post, Request, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { StampService } from "./stamp.service";
import { success, error } from "src/lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import { ApiBasicAuth, ApiTags, ApiResponse, ApiOperation } from "@nestjs/swagger";
import { PageUrlDto } from "./dto/create-stamp.dto";


@ApiBasicAuth()
@ApiTags('stamp')
@ApiResponse({ status: 403, description: 'Forbidden' })
@Controller("stamp")
@UseInterceptors(LoggingInterceptor)
export class StampController {
  constructor(private readonly stampService: StampService) {}

  @ApiOperation({ summary: 'Generate digital stamp for all websites' })
  @ApiResponse({
    status: 200,
    description: 'The stamps were generated',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("all")
  async generateAllWebsitesDigitalStamp(): Promise<any> {
    const errors = await this.stampService.generateAllWebsitesDigitalStamp();
    return errors.length === 0 ? success(true) : error(errors, false);
  }

  @ApiOperation({ summary: 'Generate digital stamp for a specific website' })
  @ApiResponse({
    status: 200,
    description: 'The stamp was generated',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("websites")
  async generateWebsiteDigitalStamp(@Body() pageUrlDto: PageUrlDto): Promise<any> {
    const websitesId =pageUrlDto.websitesId;
    return success(
      await this.stampService.generateWebsitesDigitalStamp(websitesId)
    );
  }
}
