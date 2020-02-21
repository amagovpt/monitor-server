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
  @Get('exists/:url')
  async checkIfDomainExists(@Param('url') url: string): Promise<any> {
    return success(!!await this.domainService.findByUrl(decodeURIComponent(url)));
  }
}
