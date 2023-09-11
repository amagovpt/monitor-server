import { Injectable } from '@nestjs/common';
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
    fs.writeFileSync('./action-log/ds-' + name, this.digitallySignContent(fileContent));
  }

  digitallySignContent(content:string){
    const privateKey = fs.readFileSync('private_key.pem');
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(content);
    return signer.sign(privateKey, 'base64')
  }
}
