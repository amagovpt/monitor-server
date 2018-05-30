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

module.exports.create = async (_websiteId, _url, _tags) => {
  let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

  let query = `UPDATE Domain SET End_Date = "${date}", Active = 0
    WHERE WebsiteId = "${_websiteId}" AND Active = "1"`;

  await Database.execute(query);

  query = `INSERT INTO Domain (WebsiteId, Url, Start_Date, Active) 
    VALUES ("${_websiteId}", "${_url}", "${date}", "1")`;
  
  const res = await Database.execute(query);

  let size = _.size(_tags);
  for(let i = 0 ; i < size ; i++) {
    query = `INSERT INTO TagDomain (TagId, DomainId) VALUES ("${_tags[i]}", "${res.insertId}")`;
    await Database.execute(query);
  }

  return Response.success();
}

module.exports.exists = async (_domain) => {
  _domain = decodeURIComponent(_domain);
  const query = `SELECT * FROM Domain WHERE Url = "${_domain}" LIMIT 1`;

  const domain = await Database.execute(query);
  return Response.success(_.size(domain) === 1);
}

module.exports.all = async () => {
  const query = `SELECT * FROM Domain WHERE Active = "1"`;
  
  const domains = await Database.execute(query);
  return Response.success(domains);
}

module.exports.all_info = async () => {
  const query = `
    SELECT 
      d.DomainId,
      d.Url,
      d.Active,
      d.Start_Date,
      d.End_Date,
      w.Name as Website,
      COUNT(distinct p.PageId) as Pages,
      COUNT(distinct td.TagId) as Tags
    FROM 
      Domain as d
    LEFT OUTER JOIN Website as w ON w.WebsiteId = d.WebsiteId
    LEFT OUTER JOIN Page as p ON p.DomainId = d.DomainId
    LEFT OUTER JOIN TagDomain as td ON td.DomainId = d.DomainId
    GROUP BY d.DomainId`;

  const res = await Database.execute(query);
  return Response.success(res);
}