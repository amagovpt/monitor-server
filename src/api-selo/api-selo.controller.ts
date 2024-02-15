import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { error, success } from 'src/lib/response';
import { LoggingInterceptor } from 'src/log/log.interceptor';
import { ApiSeloService } from './api-selo.service';

@ApiTags('apiselo')
@ApiResponse({ status: 403, description: 'Forbidden' })
@Controller('apiselo')
@UseInterceptors(LoggingInterceptor)
export class APISeloController {
  constructor(private readonly apiSeloService: ApiSeloService) {}

  @ApiOperation({ summary: 'Retrieve digital stamp information for all websites' })
  @ApiResponse({
    status: 200,
    description: 'The information was retrieved',
    type: Boolean,
  })
  @Get("all")
  async getAllStamps(): Promise<any> {
    const response = await this.apiSeloService.getAllStamps();
    return response;
  }

}
