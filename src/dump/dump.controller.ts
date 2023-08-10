import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';
import { DumpService } from './dump.service';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
const execSync = require('child_process').execSync;


@UseGuards(AuthGuard("jwt-admin"))
@Controller('dump')
export class DumpController {
  constructor(private readonly dumpService: DumpService) {}

  @Get()
  createDump() {
    return this.dumpService.createDump();
  }

  @Get('file')
  async getLog(@Res() res: Response,) {
    const path = this.dumpService.path;
    if (path) {
      const file = createReadStream(join(process.cwd(), path));
      file.pipe(res);
    }
  }

  @Get('restart')
  async restart() {
    execSync('pm2 restart monitor-server');
  }


}
