import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DumpService } from './dump.service';


@Controller('dump')
export class DumpController {
  constructor(private readonly dumpService: DumpService) {}
  
  @Get()
  createDump() {
    return this.dumpService.createDump();
  }


}
