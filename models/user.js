"use strict";

/**
 * User Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const Database = require('../lib/_database');

/**
 * Authtentication functions
 */

module.exports.verify = function() {

}

module.exports.login = async function(email, password) {
  const query = `SELECT * FROM User WHERE Email = "${email}"`;
  console.log(query);
  return await Database.execute(query);
}

/**
 * Create functions
 */

module.exports.create = function(email, password, type) {

}

/**
 * Get functions
 */

/**
 * Update functions
 */

/**
 * Delete functions
 */