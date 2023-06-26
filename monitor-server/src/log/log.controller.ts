import { Controller, Get, Post, Body, Patch, Param, Delete, Res, UseGuards } from '@nestjs/common';
import { LogService } from './log.service';
import { createReadStream } from 'fs';
import { join } from 'path';
import { Response } from 'express';
import { success } from 'src/lib/response';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard("jwt-admin"))
@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get('error-log/:fileName')
  async getErrorLog(@Res() res: Response, @Param("fileName") fileName: string) {
    const path = "./error-log/" + fileName;
    if (path) {
      const file = createReadStream(join(process.cwd(), path));
      file.pipe(res);
    }
  }

  @Get('error-log')
  async getErrorLogList() {
    return success(this.logService.listErrorLog());
  }

  @Get('action-log')
  async getActionLogList() {
    return success(this.logService.listActionLog());
  }

  @Get('action-log/:fileName')
  async getActionLog(@Res() res: Response, @Param("fileName") fileName: string) {
    const path = "./action-log/" + fileName;
    if (path) {
      const file = createReadStream(join(process.cwd(), path));
      file.pipe(res);
    }
  }

}
