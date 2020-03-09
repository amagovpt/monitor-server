import { Controller, Post, Get, Request, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PageService } from './page.service';
import { success } from '../lib/response';

@Controller('page')
export class PageController {

  constructor(private readonly pageService: PageService) { }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('all')
  async getAllPages(): Promise<any> {
    return success(await this.pageService.findAll());
  }

  @UseGuards(AuthGuard('jwt-monitor'))
  @Get('myMonitor/website/:website')
  async getAllMyMonitorUserWebsitePages(@Request() req: any, @Param('website') website: string): Promise<any> {
    return success(await this.pageService.findAllFromMyMonitorUserWebsite(req.user.userId, website));
  }

  @UseGuards(AuthGuard('jwt-monitor'))
  @Post('myMonitor/create')
  async createMyMonitorUserWebsitePages(@Request() req: any): Promise<any> {
    const website = req.body.website;
    const domain = req.body.domain;
    const uris = JSON.parse(req.body.pages);
    return success(await this.pageService.createMyMonitorUserWebsitePages(req.user.userId, website, domain, uris));
  }

  @UseGuards(AuthGuard('jwt-monitor'))
  @Post('myMonitor/remove')
  async removeMyMonitorUserWebsitePages(@Request() req: any): Promise<any> {
    const website = req.body.website;
    const ids = JSON.parse(req.body.pagesId);
    return success(await this.pageService.removeMyMonitorUserWebsitePages(req.user.userId, website, ids));
  }

  @UseGuards(AuthGuard('jwt-study'))
  @Get('studyMonitor/tag/:tag/website/:website')
  async getStudyMonitorUserTagWebsitePages(@Request() req: any, @Param('tag') tag: string, @Param('website') website: string): Promise<any> {
    return success(await this.pageService.findStudyMonitorUserTagWebsitePages(req.user.userId, tag, website));
  }

  @UseGuards(AuthGuard('jwt-study'))
  @Post('studyMonitor/create')
  async createStudyMonitorUserTagWebsitePages(@Request() req: any): Promise<any> {
    const tag = req.body.tag;
    const website = req.body.website;
    const domain = req.body.domain;
    const uris = JSON.parse(req.body.pages).map(page => decodeURIComponent(page));
    return success(await this.pageService.createStudyMonitorUserTagWebsitePages(req.user.userId, tag, website, domain, uris));
  }

  @UseGuards(AuthGuard('jwt-study'))
  @Post('studyMonitor/remove')
  async removeStudyMonitorUserTagWebsitePages(@Request() req: any): Promise<any> {
    const tag = req.body.tag;
    const website = req.body.website;
    const pagesId = JSON.parse(req.body.pagesId);
    return success(await this.pageService.removeStudyMonitorUserTagWebsitePages(req.user.userId, tag, website, pagesId));
  }
}
