import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PageService } from './page.service';
import { success } from '../response';

@Controller('page')
export class PageController {

  constructor(private readonly pageService: PageService) { }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('all')
  async getAllPages(): Promise<any> {
    return success(await this.pageService.findAll());
  }
}
