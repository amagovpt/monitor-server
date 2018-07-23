'use strict';

/**
 * SECURITY FUNCTIONS
 */

/**
 * Libraries and modules
 */
const Promise = require('promise');
const { trim } = require('lodash');
const { createCipher, createDecipher, createHash } = require('crypto');
const { readFile } = require('fs');
const { SECRET_KEY_FILE } = require('../lib/_constants');

module.exports.encrypt = (text) => {
  return new Promise((resolve, reject) => {
    readFile(SECRET_KEY_FILE, (err, password) => {
      if (err) {
        reject(err);
      }
      else {
        let cipher = createCipher('aes-256-ctr', trim(password));
        let crypted = cipher.update(text, 'utf8', 'hex');
        crypted += cipher.final('hex');
        resolve(crypted);
      }
    });
  });
}
 
module.exports.decrypt = (text) => {
  return new Promise((resolve, reject) => {
    readFile(SECRET_KEY_FILE, (err, password) => {
      if (err) {
        reject(err);
      }
      else {
        let decipher = createDecipher('aes-256-ctr', trim(password));
        let dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        resolve(dec);
      }
    });
  });
}

module.exports.generate_password_hash = (password) => {
  return createHash('sha256').update(password).digest('hex');
}

module.exports.generate_unique_hash = () => {
  let current_date = (new Date()).valueOf().toString();
  let random = Math.random().toString();
  return createHash('sha256').update(current_date + random).digest('hex');
}