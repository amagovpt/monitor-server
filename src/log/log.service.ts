import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
var fs = require('fs');
const crypto = require('crypto');

@Injectable()
export class LogService {

  listErrorLog() {
    return fs.readdirSync('./error-log/');
  }

  listActionLog() {
    return fs.readdirSync('./action-log/');
  }

  signFile(name:string){
    const fileContent = fs.readFileSync('./action-log/'+name);
    console.log(name)
    console.log(this.digitallySignContent(fileContent))
    fs.writeFileSync('./action-log/ds-' + name, this.digitallySignContent(fileContent));
  }

  digitallySignContent(content:string){
    const privateKey = fs.readFileSync('../keys');
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(content);
    return signer.sign(privateKey, 'base64')
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async signEveryYeterdayLogFile(): Promise<void> {
    const fileList = this.listActionLog();
    const timeStamp = new Date().getTime();
    const yesterdayTimeStamp = timeStamp - 24 * 60 * 60 * 1000;
    const yesterdayDate = new Date(yesterdayTimeStamp);
    const dateString = yesterdayDate.toISOString().split('T')[0]
    const todayList = fileList.filter((s) => { return s.includes(dateString)});
    todayList.map((fileName) => { this.signFile(fileName)});
  
  }
}
