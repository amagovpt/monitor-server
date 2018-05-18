"use strict";

/**
 * Page Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const Response = require('../lib/_response');
const Database = require('../lib/_database');

module.exports.create = async (domainId, uri) => {
  let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

  let query = `INSERT INTO Page (DomainId, Uri, Creation_Date) 
    VALUES ("${domainId}", "${uri}", "${date}")`;
  
  await Database.execute(query);

  return Response.success();
}

module.exports.all = async () => {
  const query = `SELECT p.* FROM Page as p, Domain as d
    WHERE d.DomainId = p.PageId AND d.Active = "1"`;
  
  const pages = await Database.execute(query);
  return Response.success(pages);
}