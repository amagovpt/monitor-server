import { Controller, Request, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DomainService } from './domain.service';
import { success } from '../response';

@Controller('domain')
export class DomainController {

  constructor(private readonly domainService: DomainService) { }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('all')
  async getAllDomains(): Promise<any> {
    return success(await this.domainService.findAll());
  }
}
