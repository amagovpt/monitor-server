import { Injectable } from "@nestjs/common";
var fs = require("fs");

@Injectable()
export class LogService {
  listErrorLog() {
    return fs.readdirSync("./error-log/");
  }

  listActionLog() {
    return fs.readdirSync("./action-log/");
  }
}
