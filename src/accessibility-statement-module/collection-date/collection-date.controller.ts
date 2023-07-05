import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CollectionDateService } from './collection-date.service';
import { success } from 'src/lib/response';


@Controller('collection-date')
export class CollectionDateController {
  constructor(private readonly collectionDateService: CollectionDateService) {}

  @Get()
  async findLatest() {
    return success(await this.collectionDateService.findLatest());
  }

}
