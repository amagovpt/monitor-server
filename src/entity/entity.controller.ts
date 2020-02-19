import { Controller, Get, Request, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EntityService } from './entity.service';
import { success } from '../response';

@Controller('entity')
export class EntityController {

  constructor(private readonly entityService: EntityService) { }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('all')
  async getAllEntities(): Promise<any> {
    return success(await this.entityService.findAll());
  }
}
