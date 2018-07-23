'use strict';

/**
 * User Model
 */

/**
 * Libraries and modules
 */
const { isEqual, size } = require('lodash');
const { encrypt, decrypt, generate_password_hash, generate_unique_hash } = require('../lib/_security');
const { success, error } = require('../lib/_response');
const { execute_query } = require('../lib/_database');
const { 
  UserError,
  UserNotFoundError,
  UserDataCompromisedError,
  PermissionDeniedError,
  SessionExpiredError
} = require('../lib/_error');

/**
 * Authtentication functions
 */

const create_user_cookie = async (user) => {
  try {
    delete user.UserId;
    delete user.Password;
    delete user.Register_Date;
    delete user.Last_Login;
    
    const date = new Date();
    date.setTime(date.getTime() + 1 * 86400000);
    user.Expire = date.toISOString().replace(/T/, ' ').replace(/\..+/, '');

    const cookie = await encrypt(JSON.stringify(user));
    
    return success(cookie);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.verify_user = async (res, cookie, admin=false) => {
  try {
    cookie = JSON.parse(await decrypt(cookie));

    const query = `SELECT * FROM User WHERE Email = "${cookie.Email}" LIMIT 1`;
    let user = await execute_query(query);
    user = user[0];

    if (isEqual(size(user), 0)) {
      res.send(error(new UserNotFoundError()));
      return -1;
    }
    if (!isEqual(user.Type, cookie.Type)) {
      res.send(error(new UserDataCompromisedError()));
      return -1;
    }
    if (!isEqual(user.Unique_Hash, cookie.Unique_Hash)) {
      res.send(error(new UserDataCompromisedError()));
      return -1; 
    }
    if (admin && !isEqual(user.Type, 'nimda')) {
      res.send(error(new PermissionDeniedError()));
      return -1;  
    }
    if (new Date(user.Expire) < new Date()) {
      res.send(error(new SessionExpiredError()));
      return -1; 
    }

    return user.UserId;
  } catch(err) {
    res.send(error(err));
    return -1;
  }
}

module.exports.login_user = async (email, password, app) => {
  try {
    const query = `SELECT * FROM User WHERE Email = "${email}" AND Type = "${app}" LIMIT 1`;
    const data = await execute_query(query);

    if (size(data) === 0) {
      return error(new UserNotFoundError());
    } else {
      let user = data[0];
      if (isEqual(user.Password, generate_password_hash(password))) {
        return create_user_cookie(user);
      } else {
        return error(new UserError(null, -2, 'INVALID_PASSWORD'));
      }
    }
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

/**
 * Create functions
 */

module.exports.create_user = async (email, password, type, websites) => {
  try {
    const password_hash = generate_password_hash(password);
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const hash = generate_unique_hash();
    let query = `INSERT INTO User (Email, Password, Type, Register_Date, Unique_Hash) 
      VALUES ("${email}", "${password_hash}", "${type}", "${date}", "${hash}")`;
    
    const data = await execute_query(query);

    const size = size(websites);
    for (let i = 0 ; i < size ; i++) {
      query = `UPDATE Website SET UserId = "${data.insertId}" WHERE WebsiteId = "${websites[i]}"`;
      execute_query(query);
    }

    return success();
  } catch(err) {
    return error(err);
  }
}

/**
 * Get functions
 */

module.exports.email_exists = async (email) => {
  try {
    const query = `SELECT UserId FROM User WHERE Email = "${email}" LIMIT 1`;
    const users = await execute_query(query);
    return success(size(users) === 1);
  } catch(err) {
    return error(err);
  } 
}

module.exports.get_all_users = async () => {
  try {
    const query = `
      SELECT 
        u.UserId, u.Email, u.Type, u.Register_Date, u.Last_Login, 
        COUNT(distinct w.WebsiteId) as Websites
      FROM User as u
      LEFT OUTER JOIN Website as w ON w.UserId = u.UserId
      WHERE u.Type != "nimda"
      GROUP BY u.UserId`;
    const users = await execute_query(query);
    return success(users);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_monitor_users = async () => {
  try {
    const query = `SELECT UserId, Email, Type, Register_Date, Last_Login FROM User WHERE Type = "monitor"`;
    const users = await execute_query(query);
    return success(users);
  } catch(err) {
    return error(err);
  }
}

/**
 * Update functions
 */

/**
 * Delete functions
 */