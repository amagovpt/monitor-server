import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';
import { DumpService } from './dump.service';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { success } from 'src/lib/response';
const execSync = require('child_process').execSync;


@UseGuards(AuthGuard("jwt-admin"))
@Controller('dump')
export class DumpController {
  constructor(private readonly dumpService: DumpService) {}

  @Post("create")
  createDump() {
    return this.dumpService.createDump();
  }

  @Get('file/:fileName')
  async getDump(@Res() res: Response, @Param("fileName") fileName: string) {
    const path = './'+fileName;
    if (path) {
      const file = createReadStream(join(process.cwd(), path));
      file.pipe(res);
    }
  }

  @Post("delete-file")
  async deleteFile(@Body() body:any ){
    return success(this.dumpService.deleteDump(body.file));
  }
  @Get('restart')
  async restart() {
    execSync('pm2 restart monitor-server2');
  }


  @Get('file-list')
  async getActionLogList() {
    return success(this.dumpService.listDumps());
  }
}
