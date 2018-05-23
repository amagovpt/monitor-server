"use strict";

/**
 * Entity Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const Response = require('../lib/_response');
const Database = require('../lib/_database');

module.exports.create = async (shortName, longName, websites, tags) => {
  let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  let query = `INSERT INTO Entity (Short_Name, Long_Name, Creation_Date) 
    VALUES ("${shortName}", "${longName}", "${date}")`;
  
  const res = await Database.execute(query);

  let size = _.size(websites);
  for(let i = 0 ; i < size ; i++) {
    query = `UPDATE Website SET EntityId = ${res.insertId} 
      WHERE WebsiteId = ${websites[i]}`;
    await Database.execute(query);
  }

  size = _.size(tags);
  for(let i = 0 ; i < size ; i++) {
    query = `INSERT INTO TagEntity (TagId, EntityId) VALUES ("${tags[i]}", "${res.insertId}")`;
    await Database.execute(query);
  }

  return Response.success();
}

module.exports.all = async () => {
  const query = `SELECT * FROM Entity`;
  
  const entities = await Database.execute(query);
  return Response.success(entities);
}