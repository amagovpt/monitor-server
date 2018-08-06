"use strict";

/**
 * Domain Model
 */

/**
 * Libraries and modules
 */
const { size } = require('lodash');
const { each } = require('async');
const { success } = require('../lib/_response');
const { execute_query } = require('../lib/_database');

module.exports.create_domain = async (website_id, url, tags) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let query = `UPDATE Domain SET End_Date = "${date}", Active = 0
      WHERE WebsiteId = "${website_id}" AND Active = "1"`;

    await execute_query(query);

    query = `INSERT INTO Domain (WebsiteId, Url, Start_Date, Active) 
      VALUES ("${website_id}", "${url}", "${date}", "1")`;
    
    const domain = await execute_query(query);

    const size = size(tags);
    for (let i = 0 ; i < size ; i++) {
      query = `INSERT INTO TagDomain (TagId, DomainId) VALUES ("${tags[i]}", "${domain.insertId}")`;
      await execute_query(query);
    }

    return success(domain.insertId);
  } catch(err) {
    return error(err);
  }
}

module.exports.domain_exists = async (url) => {
  try {
    url = decodeURIComponent(url);
    const query = `SELECT * FROM Domain WHERE Url = "${url}" LIMIT 1`;

    const domain = await execute_query(query);
    return success(size(domain) === 1);
  } catch(err) {
    return error(err);
  } 
}

module.exports.get_all_active_domains = async () => {
  try {
    const query = `SELECT * FROM Domain WHERE Active = "1"`;
    const domains = await execute_query(query);
    return success(domains);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_domains = async () => {
  try {
    const query = `SELECT * FROM Domain`;
    const domains = await execute_query(query);
    return success(domains);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_domains_info = async () => {
  try {
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

    const domains = await execute_query(query);
    return success(domains);
  } catch(err) {
    return error(err);
  }
}