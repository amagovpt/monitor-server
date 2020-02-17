import { readFileSync } from 'fs';

export const jwtConstants = {
  secret: 'secretKey',
  publicKey: readFileSync('/home/vagrant/accessmonitor/keys.pub'),
  privateKey: readFileSync('/home/vagrant/accessmonitor/keys')
};