'use strict';

/**
 * Database module
 */

/**
 * Libraries and modules
 */
const Promise = require('promise');
const { createConnection } = require('mysql');
const { DB_CONFIG } = require('./_constants');
const { DbError } = require('./_error');

module.exports.execute_query = query => {
  return new Promise((resolve, reject) => {
    const connection = createConnection(DB_CONFIG);
    connection.connect();

    connection.query(query, (err, res) => {
      connection.end();
      
      if (err) {
        reject(new DbError(err));
      } else { 
        resolve(res);
      }
    });
  });
}