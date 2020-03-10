import { Controller, Param, Request, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DomainService } from './domain.service';
import { success } from '../lib/response';

@Controller('domain')
export class DomainController {

  constructor(private readonly domainService: DomainService) { }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('all')
  async getAllDomains(): Promise<any> {
    return success(await this.domainService.findAll());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('allOfficial')
  async getAllOfficialDomains(): Promise<any> {
    return success(await this.domainService.findAllOfficial());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get(':domain/user/:user/pages')
  async getAllDomainPages(@Param('domain') domain: string, @Param('user') user: string): Promise<any> {
    domain = decodeURIComponent(domain);
    const type = await this.domainService.findUserType(user);
    let flags: string;
    switch (type) {
      case 'nimda':
        flags = '1__';
        break;
      case 'monitor':
        flags = '_1_';
        break;
      default:
        flags = '%';
        break;
    }
    return success(await this.domainService.findAllDomainPages(user, type, domain, flags));
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('exists/:url')
  async checkIfDomainExists(@Param('url') url: string): Promise<any> {
    return success(!!await this.domainService.findByUrl(decodeURIComponent(url)));
  }

  @UseGuards(AuthGuard('jwt-monitor'))
  @Get('myMonitor/website/:website')
  async getMyMonitorUserWebsiteDomain(@Request() req: any, @Param('website') website: string): Promise<any> {
    return success(await this.domainService.findMyMonitorUserWebsiteDomain(req.user.userId, website));
  }

  @UseGuards(AuthGuard('jwt-study'))
  @Get('studyMonitor/tag/:tag/website/:website')
  async getStudyMonitorUserTagWebsiteDomain(@Request() req: any, @Param('tag') tag: string, @Param('website') website: string): Promise<any> {
    return success(await this.domainService.findStudyMonitorUserTagWebsiteDomain(req.user.userId, tag, website));
  }
}
