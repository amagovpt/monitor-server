'use strict';

/**
 * User Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
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
    if (cookie === 'null') {
      return -1;
    }

    cookie = JSON.parse(await decrypt(cookie));

    const query = `SELECT * FROM User WHERE LOWER(Email) = "${_.toLower(cookie.Email)}" LIMIT 1`;
    let user = await execute_query(query);
    user = user[0];

    if (_.isEqual(_.size(user), 0)) {
      res.send(error(new UserNotFoundError()));
      return -1;
    }
    if (!_.isEqual(user.Type, cookie.Type)) {
      res.send(error(new UserDataCompromisedError()));
      return -1;
    }
    if (!_.isEqual(user.Unique_Hash, cookie.Unique_Hash)) {
      res.send(error(new UserDataCompromisedError()));
      return -1; 
    }
    if (admin && !_.isEqual(user.Type, 'nimda')) {
      res.send(error(new PermissionDeniedError()));
      return -1;  
    }
    if (new Date(user.Expire) < new Date()) {
      res.send(error(new SessionExpiredError()));
      return -1; 
    }

    return user.UserId;
  } catch(err) {
    console.log(err);
    res.send(error(err));
    return -1;
  }
}

module.exports.login_user = async (email, password, app) => {
  try {
    let query = `SELECT * FROM User WHERE LOWER(Email) = "${_.toLower(email)}" AND 
      LOWER(Type) = "${_.toLower(app)}" LIMIT 1`;
    const users = await execute_query(query);

    if (_.size(users) === 0) {
      return error(new UserNotFoundError());
    } else {
      let user = users[0];
      if (_.isEqual(user.Password, generate_password_hash(password))) {
        const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        query = `UPDATE User SET Last_Login = "${date}" WHERE UserId = "${user.UserId}"`;
        await execute_query(query);
        
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

    for (let w of websites) {
      query = `UPDATE Website SET UserId = "${data.insertId}" WHERE WebsiteId = "${w}"`;
      await execute_query(query);
    }

    return success(data.insertId);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

/**
 * Get functions
 */

module.exports.get_number_of_access_studies_users = async () => {
  try {
    const query = `SELECT COUNT(*) as Users FROM User WHERE LOWER(Type) = "studies";`;
    const users = await execute_query(query);
    return success(users[0].Users);
  } catch(err) {
    console.log(err);
    return error(err);
  } 
}

module.exports.get_number_of_my_monitor_users = async () => {
  try {
    const query = `SELECT COUNT(*) as Users FROM User WHERE LOWER(Type) = "monitor";`;
    const users = await execute_query(query);
    return success(users[0].Users);
  } catch(err) {
    console.log(err);
    return error(err);
  } 
}

module.exports.user_exists = async (email) => {
  try {
    const query = `SELECT UserId FROM User WHERE LOWER(Email) = "${_.toLower(email)}" LIMIT 1`;
    const users = await execute_query(query);
    return success(_.size(users) === 1);
  } catch(err) {
    console.log(err);
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
      WHERE LOWER(u.Type) != "nimda"
      GROUP BY u.UserId`;
    const users = await execute_query(query);
    return success(users);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_monitor_users = async () => {
  try {
    const query = `SELECT UserId, Email, Type, Register_Date, Last_Login FROM User WHERE LOWER(Type) = "monitor"`;
    const users = await execute_query(query);
    return success(users);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_user_info = async (user_id) => {
  try {
    let query = `SELECT * FROM User WHERE UserId = "${user_id}" LIMIT 1`;

    let user = await execute_query(query);

    if (_.size(user) === 0) {
      throw new UserNotFoundError();
    } else {
      user = user[0];

      if (user.Type === 'monitor') {
        query = `SELECT * FROM Website WHERE UserId = "${user_id}"`;
        const websites = await execute_query(query);

        user.websites = websites;
      }
    }

    delete user.Password;

    return success(user);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

/**
 * Update functions
 */

module.exports.update_user = async (user_id, password, app, default_websites, websites) => {
  try {
    let query = '';

    if (password !== '') {
      query = `UPDATE User SET Password = "${generate_password_hash(password)}" WHERE UserId = "${user_id}"`;
      await execute_query(query);
    }

    if (app === 'monitor') {
      for (let website_id of default_websites) {
        if (!_.includes(websites, website_id)) {
          query = `UPDATE Website SET UserId = NULL WHERE WebsiteId = "${website_id}"`;
          await execute_query(query);
        }
      }

      for (let website_id of websites) {
        if (!_.includes(default_websites, website_id)) {
          query = `UPDATE Website SET UserId = "${user_id}" WHERE WebsiteId = "${website_id}"`;
          await execute_query(query);
        }
      }
    }

    return success(user_id);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.change_user_password = async (user_id, password, new_password) => {
  try {
    let query = `SELECT * FROM User WHERE UserId = "${user_id}" LIMIT 1`;
    let user = await execute_query(query);

    if (_.size(user) === 1) {
      if (generate_password_hash(password) === user[0].Password) {
        query = `UPDATE User SET Password = "${generate_password_hash(new_password)}" WHERE UserId = "${user_id}"`;
        await execute_query(query);
        return success(true);
      } else {
        return error({ code: -1, message: 'WRONG_USER_PASSWORD' });
      }
    } else {
      throw new UserNotFoundError();
    }
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

/**
 * Delete functions
 */

module.exports.delete_user = async (user_id, app) => {
  try {
    let query = '';

    if (app === 'monitor') {
      query = `UPDATE Website SET UserId = NULL WHERE UserId = "${user_id}"`;
      await execute_query(query);
    } else {
      query = `DELETE FROM Tag WHERE UserId = "${user_id}" AND TagId <> 0`;
      await execute_query(query);

      query = `DELETE FROM Website WHERE UserId = "${user_id}" AND WebsiteId <> 0`;
      await execute_query(query);
    }

    query = `DELETE FROM User WHERE UserId = "${user_id}"`;
    await execute_query(query);

    return success(user_id);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}