"use strict";

/**
 * Website Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const Response = require('../lib/_response');
const Database = require('../lib/_database');

/**
 * Create functions
 */

module.exports.create = async (shortName, longName, domain, entityId, userId, tags) => {
  let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  let query = `INSERT INTO Website (Short_Name, Long_Name, Creation_Date) 
    VALUES ("${shortName}", "${longName}", "${date}")`;
  
  if (entityId && userId) {
    query = `INSERT INTO Website (EntityId, UserId, Short_Name, Long_Name, Creation_Date) 
    VALUES ("${entityId}", "${userId}", "${shortName}", "${longName}", "${date}")`;
  } else if (entityId) {
     query = `INSERT INTO Website (EntityId, Short_Name, Long_Name, Creation_Date) 
    VALUES ("${entityId}", "${shortName}", "${longName}", "${date}")`;
  } else if (userId) {
     query = `INSERT INTO Website (UserId, Short_Name, Long_Name, Creation_Date) 
    VALUES ("${userId}", "${shortName}", "${longName}", "${date}")`;
  }

  const res = await Database.execute(query);

  query = `INSERT INTO Domain (WebsiteId, Url, Start_Date, Active) 
    VALUES ("${res.insertId}", "${domain}", "${date}", "1")`;

  await Database.execute(query);

  let size = _.size(tags);
  for(let i = 0 ; i < size ; i++) {
    query = `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES ("${tags[i]}", "${res.insertId}")`;
    await Database.execute(query);
  }

  return Response.success();
}

/**
 * Get functions
 */

module.exports.short_name_exists = async (name) => {
  const query = `SELECT * FROM Website WHERE Short_Name = "${name}" LIMIT 1`;

  const website = await Database.execute(query);
  return Response.success(_.size(website) === 1);
}

module.exports.long_name_exists = async (name) => {
  const query = `SELECT * FROM Website WHERE Long_Name = "${name}" LIMIT 1`;

  const website = await Database.execute(query);
  return Response.success(_.size(website) === 1);
}

module.exports.all = async () => {
  const query = `SELECT * FROM Website`;
  const res = await Database.execute(query);
  return Response.success(res);
}

module.exports.all_without_entity = async () => {
  const query = `SELECT * FROM Website WHERE EntityId IS NULL`;
  const res = await Database.execute(query);
  return Response.success(res);
}

module.exports.all_without_user = async () => {
  const query = `SELECT * FROM Website WHERE UserId IS NULL`;
  const res = await Database.execute(query);
  return Response.success(res);
}

module.exports.all_info = async () => {
  const query = `
    SELECT 
      w.WebsiteId, 
      w.Short_Name, 
      w.Long_Name, 
      w.Creation_Date,
      e.Long_Name as Entity,
      u.Email as User,
      d.Url as Current_Domain,
      COUNT(distinct d2.DomainId) as Domains,
      COUNT(distinct p.PageId) as Pages,
      COUNT(distinct tw.TagId) as Tags
    FROM 
        Website as w
    LEFT OUTER JOIN Entity as e ON e.EntityId =  w.EntityId
    LEFT OUTER JOIN User as u ON u.UserId = w.UserId
    LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
    LEFT OUTER JOIN Domain as d2 ON d2.WebsiteId = w.WebsiteId
    LEFT OUTER JOIN Page as p ON p.DomainId = d2.DomainId
    LEFT OUTER JOIN TagWebsite as tw ON tw.WebsiteId = w.WebsiteId
    GROUP BY w.WebsiteId, d.Url`;

  const res = await Database.execute(query);
  return Response.success(res);
}