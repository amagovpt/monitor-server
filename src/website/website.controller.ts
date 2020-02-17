import { Controller, Request, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WebsiteService } from './website.service';
import { success } from '../response';

@Controller('website')
export class WebsiteController {

  constructor(private readonly websiteService: WebsiteService) { }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('withoutUser')
  async getWebsitesWithoutUser(@Request() req): Promise<any> {
    return success(await this.websiteService.findAllWithoutUser());
  }
}
