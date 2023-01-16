import { Injectable } from '@nestjs/common';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
var fs = require('fs');

@Injectable()
export class LogService {

  listErrorLog() {
    return fs.readdirSync('/error-log/');
  }

  listActionLog() {
    return fs.readdirSync('/action-log/');
  }
}
