"use strict";

/**
 * Domain Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const { success } = require('../lib/_response');
const { execute_query } = require('../lib/_database');

module.exports.create_domain = async (website_id, url) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let query = `UPDATE Domain SET End_Date = "${date}", Active = 0
      WHERE WebsiteId = "${website_id}" AND Active = "1"`;

    await execute_query(query);

    url = _.replace(url, 'https://', '');
    url = _.replace(url, 'http://', '');
    url = _.replace(url, 'www.', '');

    query = `INSERT INTO Domain (WebsiteId, Url, Start_Date, Active) 
      VALUES ("${website_id}", "${url}", "${date}", "1")`;
    
    const domain = await execute_query(query);

    return success(domain.insertId);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.domain_exists = async (url) => {
  try {
    url = _.replace(url, 'https://', '');
    url = _.replace(url, 'http://', '');
    url = _.replace(url, 'www.', '');

    const query = `SELECT * FROM Domain WHERE Url = "${url}" LIMIT 1`;

    const domain = await execute_query(query);
    return success(_.size(domain) === 1);
  } catch(err) {
    console.log(err);
    return error(err);
  } 
}

module.exports.get_all_active_domains = async () => {
  try {
    const query = `SELECT * FROM Domain WHERE Active = "1"`;
    const domains = await execute_query(query);
    return success(domains);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_domains = async () => {
  try {
    const query = `SELECT d.*, COUNT(distinct dp.PageId) as Pages, u.Email as User
      FROM 
        Domain as d
        LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
        LEFT OUTER JOIN Website as w ON w.WebsiteId = d.WebsiteId
        LEFT OUTER JOIN User as u ON u.UserId = w.UserId
      GROUP BY d.DomainId`;
    const domains = await execute_query(query);
    return success(domains);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_official_domains = async () => {
  try {
    const query = `SELECT 
        d.*, 
        COUNT(distinct dp.PageId) as Pages 
      FROM 
        Domain as d
        LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId,
        Website as w,
        User as u
      WHERE
        d.Active = '1' AND
        w.WebsiteId = d.WebsiteId AND
        (
          w.UserId IS NULL OR
          (
            u.UserId = w.UserId AND
            u.Type != 'studies'
          )
        )
      GROUP BY d.DomainId`;
    const domains = await execute_query(query);
    return success(domains);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_website_domains = async (user, website) => {
  try {
    let query = '';
    if (user === 'admin') {
      query = `SELECT 
          d.*, 
          COUNT(distinct dp.PageId) as Pages,
          u2.Email as User
        FROM 
          Domain as d
          LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
          LEFT OUTER JOIN Website as w2 ON w2.WebsiteId = d.WebsiteId
          LEFT OUTER JOIN User as u2 ON u2.UserId = w2.UserId,
          Website as w,
          User as u
        WHERE
          w.WebsiteId = d.WebsiteId AND
          w.Name = "${website}" AND
          (
            w.UserId IS NULL OR
            (
              u.UserId = w.UserId AND
              u.Type != 'studies'
            )
          )
        GROUP BY d.DomainId`;
    } else {
      query = `SELECT d.*, COUNT(distinct dp.PageId) as Pages, u.Email as User 
        FROM 
          Domain as d
          LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId,
          User as u,
          Website as w
        WHERE
          u.Email = "${user}" AND
          w.UserId = u.UserId AND
          w.Name = "${website}" AND
          d.WebsiteId = w.WebsiteId
        GROUP BY d.DomainId`;
    }
    
    const domains = await execute_query(query);
    return success(domains);
  } catch(err) {
    console.log(err);
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
    console.log(err);
    return error(err);
  }
}

module.exports.delete_domain = async (domain_id) => {
  try {
    const query = `DELETE FROM Domain WHERE DomainId = "${domain_id}"`;
    await execute_query(query);

    return success(domain_id);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}