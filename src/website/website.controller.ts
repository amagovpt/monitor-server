import { Controller, Request, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WebsiteService } from './website.service';
import { success } from '../response';

@Controller('website')
export class WebsiteController {

  constructor(private readonly websiteService: WebsiteService) { }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('all')
  async getAllWebsites(): Promise<any> {
    return success(await this.websiteService.findAll());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('official')
  async getAllOfficialWebsites(): Promise<any> {
    return success(await this.websiteService.findAllOfficial());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('withoutUser')
  async getWebsitesWithoutUser(@Request() req): Promise<any> {
    return success(await this.websiteService.findAllWithoutUser());
  }
}
