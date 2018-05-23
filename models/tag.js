"use strict";

/**
 * Tag Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const Response = require('../lib/_response');
const Database = require('../lib/_database');

module.exports.create = async (name, observatorio, entities, websites, domains, pages) => {
  let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

  let query = `INSERT INTO Tag (Name, Show_in_Observatorio, Creation_Date) 
    VALUES ("${name}", "${observatorio?1:0}", "${date}")`;
  
  const res = await Database.execute(query);

  let size = _.size(entities);
  for (let i = 0 ; i < size ; i++) {
    query = `INSERT INTO TagEntity (TagId, EntityId) VALUES ("${res.insertId}", "${entities[i]}")`;
    await Database.execute(query);
  }

  size = _.size(websites);
  for (let i = 0 ; i < size ; i++) {
    query = `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES ("${res.insertId}", "${websites[i]}")`;
    await Database.execute(query);
  }

  size = _.size(domains);
  for (let i = 0 ; i < size ; i++) {
    query = `INSERT INTO TagDomain (TagId, DomainId) VALUES ("${res.insertId}", "${domains[i]}")`;
    await Database.execute(query);
  }

  size = _.size(pages);
  for (let i = 0 ; i < size ; i++) {
    query = `INSERT INTO TagPage (TagId, PageId) VALUES ("${res.insertId}", "${pages[i]}")`;
    await Database.execute(query);
  }

  return Response.success();
}

/**
 * Get functions
 */

module.exports.all = async () => {
  const query = `SELECT * FROM Tag`;
  
  const tags = await Database.execute(query);
  return Response.success(tags);
}

module.exports.all_info = async () => {
  const query = `
    SELECT 
    t.*,
      COUNT(distinct te.EntityId) as Entities,
      COUNT(distinct tw.WebsiteId) as Websites,
      COUNT(distinct td.DomainId) as Domains,
      COUNT(distinct tp.PageId) as Pages
  FROM
    Tag as t
  LEFT OUTER JOIN TagEntity as te ON te.TagId = t.TagId
  LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
  LEFT OUTER JOIN TagDomain as td ON td.TagId = t.TagId
  LEFT OUTER JOIN TagPage as tp ON tp.TagId = t.TagId
  GROUP BY t.TagId
  `;
  
  const tags = await Database.execute(query);
  return Response.success(tags);
}