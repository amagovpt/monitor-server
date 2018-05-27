"use strict";

/**
 * Database module
 */

const mysql = require('mysql');
const Promise = require('promise');
const constants = require('./_constants');

module.exports.execute = query => {
  return new Promise((resolve, reject) => {
    let con = mysql.createConnection(constants.DB_CONFIG);
    con.connect();

    con.query(query, (err, res) => {
      if (err) {
        con.end();
        reject(err);
      }
      else {
        con.end();
        resolve(res);
      }
    });
  });
}