import { Controller, InternalServerErrorException, Request, Get, Post, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as SqlString from 'sqlstring';
import { WebsiteService } from './website.service';
import { Website } from './website.entity';
import { success } from '../lib/response';

@Controller('website')
export class WebsiteController {

  constructor(private readonly websiteService: WebsiteService) { }

  @UseGuards(AuthGuard('jwt-admin'))
  @Post('create')
  async createUser(@Request() req: any): Promise<any> {
    const website = new Website();
    website.Name = req.body.name;
    website.UserId = parseInt(SqlString.escape(req.body.userId || null));
    website.EntityId = parseInt(SqlString.escape(req.body.entityId || null));
    website.Creation_Date = new Date();

    const domain = decodeURIComponent(req.body.domain);
    const tags = JSON.parse(req.body.tags).map((tag: string) => SqlString.escape(tag));
    
    const createSuccess = await this.websiteService.createOne(website, domain, tags);
    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

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
  async getWebsitesWithoutUser(): Promise<any> {
    return success(await this.websiteService.findAllWithoutUser());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('withoutEntity')
  async getWebsitesWithoutEntity(): Promise<any> {
    return success(await this.websiteService.findAllWithoutEntity());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('studyMonitor/total')
  async getNumberOfStudyMonitorUsers(): Promise<any> {
    return success(await this.websiteService.findNumberOfStudyMonitor());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('myMonitor/total')
  async getNumberOfMyMonitorUsers(): Promise<any> {
    return success(await this.websiteService.findNumberOfMyMonitor());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('observatory/total')
  async getNumberOfObservatoryTags(): Promise<any> {
    return success(await this.websiteService.findNumberOfObservatory());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('exists/:name')
  async checkIfWebsiteExists(@Param('name') name: string): Promise<any> {
    return success(!!await this.websiteService.findByName(SqlString.escape(name)));
  }
}
