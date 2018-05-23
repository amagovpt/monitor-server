"use strict";

/**
 * Domain Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const Response = require('../lib/_response');
const Database = require('../lib/_database');

module.exports.create = async (websiteId, url, tags) => {
  let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

  let query = `UPDATE Domain SET End_Date = "${date}", Active = 0
    WHERE WebsiteId = "${websiteId}" AND Active = "1"`;

  await Database.execute(query);

  query = `INSERT INTO Domain (WebsiteId, Url, Start_Date, Active) 
    VALUES ("${websiteId}", "${url}", "${date}", "1")`;
  
  const res = await Database.execute(query);

  let size = _.size(tags);
  for(let i = 0 ; i < size ; i++) {
    query = `INSERT INTO TagDomain (TagId, DomainId) VALUES ("${tags[i]}", "${res.insertId}")`;
    await Database.execute(query);
  }

  return Response.success();
}

module.exports.all = async () => {
  const query = `SELECT * FROM Domain WHERE Active = "1"`;
  
  const domains = await Database.execute(query);
  return Response.success(domains);
}