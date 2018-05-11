"use strict";

/**
 * Database module
 */

const mysql = require('mysql');
const Promise = require('promise');

function connect() {
  let connection = mysql.createConnection({
    host     : '192.168.187.130',
    user     : 'jvicente',
    password : 'Jvicente.19',
    database : 'accessmonitor'
  });

  return connection.connect();
}

module.exports.execute = async query => {
  return new Promise((resolve, reject) => {
    let con = mysql.createConnection({
      host     : '192.168.187.131',
      user     : 'jvicente',
      password : 'Jvicente.19',
      database : 'accessmonitor'
    });

    con.connect();

    con.query(query, (err, res) => {
      if (err) 
        reject(err);
      else 
        resolve(res);
    });
  });
}