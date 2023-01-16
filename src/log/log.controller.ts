import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { LogService } from './log.service';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { createReadStream } from 'fs';
import { join } from 'path';
import { Response } from 'express';


@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get('file')
  async getLog(@Res() res: Response,) {
    const path = "error.log";
    if (path) {
      const file = createReadStream(join(process.cwd(), path));
      file.pipe(res);
    }
  }

}
