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

module.exports.create = async (name, domain, entityId, userId, tags) => {
  let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  let query = `INSERT INTO Website (Name, Creation_Date) 
    VALUES ("${name}", "${date}")`;
  
  if (entityId && userId) {
    query = `INSERT INTO Website (EntityId, UserId, Name, Creation_Date) 
    VALUES ("${entityId}", "${userId}", "${name}", "${date}")`;
  } else if (entityId) {
     query = `INSERT INTO Website (EntityId, Name, Creation_Date) 
    VALUES ("${entityId}", "${name}", "${date}")`;
  } else if (userId) {
     query = `INSERT INTO Website (UserId, Name, Creation_Date) 
    VALUES ("${userId}", "${name}", "${date}")`;
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

module.exports.name_exists = async (name) => {
  const query = `SELECT * FROM Website WHERE Name = "${name}" LIMIT 1`;

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
      w.Name, 
      w.Creation_Date,
      e.Long_Name as Entity,
      u.Email as User,
      d.Url as Current_Domain,
      COUNT(distinct p.PageId) as Pages,
      COUNT(distinct tw.TagId) as Tags
    FROM 
        Website as w
    LEFT OUTER JOIN Entity as e ON e.EntityId =  w.EntityId
    LEFT OUTER JOIN User as u ON u.UserId = w.UserId
    LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
    LEFT OUTER JOIN Page as p ON p.DomainId = d.DomainId
    LEFT OUTER JOIN TagWebsite as tw ON tw.WebsiteId = w.WebsiteId
    GROUP BY w.WebsiteId, d.Url`;

  const res = await Database.execute(query);
  return Response.success(res);
}

module.exports.active_domain = async (id) => {
  const query = `SELECT Url FROM Domain WHERE WebsiteId = "${id}" AND Active = 1 LIMIT 1`;
  const res = await Database.execute(query);
  return Response.success(res);
}