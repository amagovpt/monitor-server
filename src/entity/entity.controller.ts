import { Controller, InternalServerErrorException, Get, Post, Request, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EntityService } from './entity.service';
import { EntityTable } from './entity.entity';
import { success } from '../lib/response';

@Controller('entity')
export class EntityController {

  constructor(private readonly entityService: EntityService) { }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('all')
  async getAllEntities(): Promise<any> {
    return success(await this.entityService.findAll());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Post('create')
  async createEntity(@Request() req: any): Promise<any> {
    const entity = new EntityTable();
    entity.Short_Name = req.body.shortName;
    entity.Long_Name = req.body.longName;
    entity.Creation_Date = new Date();

    const websites = JSON.parse(req.body.websites);

    const createSuccess = await this.entityService.createOne(entity, websites);
    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('exists/shortName/:shortName')
  async checkIfShortNameExists(@Param('shortName') shortName: string): Promise<any> {
    return success(!!await this.entityService.findByShortName(shortName));
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('exists/longName/:longName')
  async checkIfLongNameExists(@Param('longName') longName: string): Promise<any> {
    return success(!!await this.entityService.findByLongName(longName));
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('websites/:entity')
  async getListOfEntityWebsites(@Param('entity') entity: string): Promise<any> {
    return success(await this.entityService.findAllWebsites(entity));
  }
}
