import { readFileSync } from 'fs';

export const jwtConstants = {
  secret: 'secretKey',
  publicKey: readFileSync('../keys.pub'),
  privateKey: readFileSync('../keys')
};