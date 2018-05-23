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

module.exports.create = async (domainId, uri, tags) => {
  let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

  let query = `INSERT INTO Page (DomainId, Uri, Creation_Date) 
    VALUES ("${domainId}", "${uri}", "${date}")`;
  
  const res = await Database.execute(query);

  let size = _.size(tags);
  for(let i = 0 ; i < size ; i++) {
    query = `INSERT INTO TagPage (TagId, PageId) VALUES ("${tags[i]}", "${res.insertId}")`;
    await Database.execute(query);
  }

  return Response.success();
}

module.exports.all = async () => {
  const query = `SELECT p.* FROM Page as p, Domain as d
    WHERE d.DomainId = p.PageId AND d.Active = "1"`;
  
  const pages = await Database.execute(query);
  return Response.success(pages);
}