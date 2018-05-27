"use strict";

/**
 * User Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const crypto = require("crypto");
const fs = require('fs');
const constants = require('../lib/_constants');
const Response = require('../lib/_response');
const Database = require('../lib/_database');

/**
 * Authtentication functions
 */

function encrypt(text) {
  let password = fs.readFileSync(constants.SECRET_KEY);
  let cipher = crypto.createCipher('aes-256-ctr', _.toString(password))
  let crypted = cipher.update(text, 'utf8', 'hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text) {
  let password = fs.readFileSync(constants.SECRET_KEY);
  let decipher = crypto.createDecipher('aes-256-ctr', _.toString(password))
  let dec = decipher.update(text, 'hex', 'utf8')
  return dec += decipher.final('utf8');
  return dec;
}

function password_hash(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generate_unique_hash() {
  let current_date = (new Date()).valueOf().toString();
  let random = Math.random().toString();
  return crypto.createHash('sha256').update(current_date + random).digest('hex');
}

module.exports.verify = async (res, cookie, admin=false) => {
  cookie = JSON.parse(decrypt(cookie));

  const query = `SELECT * FROM User WHERE Email = "${cookie.Email}" LIMIT 1`;
  const data = await Database.execute(query);
  let user = data[0];

  if (_.isEqual(_.size(data), 0)) {
    res.send(Response.error(-11, 'USER_NOT_FOUND'));
    return false;
  }
  if (!_.isEqual(user.Type, cookie.Type)) {
    res.send(Response.error(-12, 'USER_DATA_COMPROMISED'));
    return false;
  }
  if (!_.isEqual(user.Unique_Hash, cookie.Unique_Hash)) {
    res.send(Response.error(-12, 'USER_DATA_COMPROMISED'));
    return false; 
  }
  if (admin && !_.isEqual(user.Type, 'nimda')) {
    res.send(Response.error(-13, 'PERMISSION_DENIED'));
    return false;  
  }
  if (new Date(user.Expire) < new Date()) {
    res.send(Response.error(-14, 'SESSION_EXPIRED'));
    return false; 
  }

  return true;
}

module.exports.login = async (email, password, app) => {
  const query = `SELECT * FROM User WHERE Email = "${email}" AND Type = "${app}" LIMIT 1`;
  const data = await Database.execute(query);

  if (_.size(data) === 0) {
    return Response.error(-1, 'USER_NOT_FOUND');
  } else {
    let user = data[0];
    if (_.isEqual(user.Password, password_hash(password))) {
      delete user.Password;
      delete user.Register_Date;
      delete user.Last_Login;
      
      let date = new Date();
      date.setTime(date.getTime() + 1 * 86400000);
      user.Expire = date.toISOString().replace(/T/, ' ').replace(/\..+/, '');

      return Response.success(encrypt(JSON.stringify(user)));
    } else {
      return Response.error(-2, 'INVALID_PASSWORD');
    }
  }
}

/**
 * Create functions
 */

module.exports.create = async (email, password, type, websites) => {
  password = password_hash(password);
  let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  let hash = generate_unique_hash();
  let query = `INSERT INTO User (Email, Password, Type, Register_Date, Unique_Hash) 
    VALUES ("${email}", "${password}", "${type}", "${date}", "${hash}")`;
  
  const res = await Database.execute(query);

  if (_.isEqual(type, 'monitor')) {
    let size = _.size(websites);
    for (let i = 0 ; i < size ; i++) {
      query = `UPDATE Website SET UserId = "${res.insertId}" WHERE WebsiteId = "${websites[i]}"`;
      await Database.execute(query);
    }
  }

  return Response.success();
}

/**
 * Get functions
 */

module.exports.email_exists = async (email) => {
  const query = `SELECT UserId FROM User WHERE Email = "${email}" LIMIT 1`;

  const user = await Database.execute(query);
  return Response.success(_.size(user) === 1);
}

module.exports.all = async () => {
  const query = `
    SELECT 
      u.UserId, u.Email, u.Type, u.Register_Date, u.Last_Login, 
      COUNT(distinct w.WebsiteId) as Websites
    FROM User as u
    LEFT OUTER JOIN Website as w ON w.UserId = u.UserId
    WHERE u.Type != "nimda"
    GROUP BY u.UserId`;
  
  const users = await Database.execute(query);
  return Response.success(users);
}

module.exports.all_from_monitor = async () => {
  const query = `SELECT UserId, Email, Type, Register_Date, Last_Login FROM User WHERE Type = "monitor"`;
  
  const users = await Database.execute(query);
  return Response.success(users);
}

/**
 * Update functions
 */

/**
 * Delete functions
 */