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

module.exports.create = async (shortName, longName, domain, entityId, userId) => {
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

  return Response.success();
}

/**
 * Get functions
 */

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