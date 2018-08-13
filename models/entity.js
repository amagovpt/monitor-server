'use strict';

/**
 * Entity Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const { success, error } = require('../lib/_response');
const { execute_query } = require('../lib/_database');

module.exports.create_entity = async (shortName, longName, websites) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let query = `INSERT INTO Entity (Short_Name, Long_Name, Creation_Date) 
      VALUES ("${shortName}", "${longName}", "${date}")`;
    
    const entity = await execute_query(query);

    for (let w of websites) {
      query = `UPDATE Website SET EntityId = ${entity.insertId} WHERE WebsiteId = ${w}`;
      await execute_query(query);
    }

    return success(entity.insertId);
  } catch(err) {
    return error(err);
  }
}

module.exports.entity_short_name_exists = async (name) => {
  try {
    const query = `SELECT * FROM Entity WHERE Short_Name = "${name}" LIMIT 1`;
    const entity = await execute_query(query);
    return success(_.size(entity) === 1);
  } catch(err) {
    return error(err);
  }
}

module.exports.entity_long_name_exists = async (name) => {
  try {
    const query = `SELECT * FROM Entity WHERE Long_Name = "${name}" LIMIT 1`;
    const entity = await execute_query(query);
    return success(_.size(entity) === 1);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_entities = async () => {
  try {
    const query = `SELECT e.*, COUNT(distinct w.WebsiteId) as Websites 
      FROM Entity as e LEFT OUTER JOIN Website as w ON w.EntityId = e.EntityId
      GROUP BY e.EntityId`;  
    const entities = await execute_query(query);
    return success(entities);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_entities_info = async () => {
  try {
    const query = `
      SELECT e.*, COUNT(distinct w.WebsiteId) as Websites, COUNT(distinct te.TagId) as Tags 
      FROM Entity as e
      LEFT OUTER JOIN Website as w ON w.EntityId = e.EntityId
      LEFT OUTER JOIN TagEntity as te ON te.EntityId = e.EntityId
      GROUP BY e.EntityId`;
    
    const entities = await execute_query(query);
    return success(entities);
  } catch(err) {
    return error(err);
  }
}
