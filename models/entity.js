'use strict';

/**
 * Entity Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const { EntityNotFoundError } = require('../lib/_error');
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
    const query = `SELECT * FROM Entity WHERE LOWER(Short_Name) = "${_.toLower(name)}" LIMIT 1`;
    const entity = await execute_query(query);
    return success(_.size(entity) === 1);
  } catch(err) {
    return error(err);
  }
}

module.exports.entity_long_name_exists = async (name) => {
  try {
    const query = `SELECT * FROM Entity WHERE LOWER(Long_Name) = "${_.toLower(name)}" LIMIT 1`;
    const entity = await execute_query(query);
    return success(_.size(entity) === 1);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_entities = async () => {
  try {
    const query = `SELECT e.*, COUNT(distinct w.WebsiteId) as Websites 
      FROM 
        Entity as e 
        LEFT OUTER JOIN Website as w ON w.EntityId = e.EntityId
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
      FROM 
        Entity as e
        LEFT OUTER JOIN Website as w ON w.EntityId = e.EntityId
        LEFT OUTER JOIN TagEntity as te ON te.EntityId = e.EntityId
      GROUP BY e.EntityId`;
    
    const entities = await execute_query(query);
    return success(entities);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_entity_info = async (entity_id) => {
  try {
    let query = `SELECT * FROM Entity WHERE EntityId = "${entity_id}" LIMIT 1`;

    let entity = await execute_query(query);

    if (_.size(entity) === 0) {
      throw new EntityNotFoundError();
    } else {
      entity = entity[0];

      query = `SELECT * FROM Website WHERE EntityId = "${entity_id}"`;
      const websites = await execute_query(query);

      entity.websites = websites;
    }

    return success(entity);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.update_entity = async (entity_id, short_name, long_name, default_websites, websites) => {
  try {
    let query = `UPDATE Entity SET Short_Name = "${short_name}", Long_Name = "${long_name}" WHERE EntityId = "${entity_id}"`;
    await execute_query(query);

    for (let website_id of default_websites) {
      if (!_.includes(websites, website_id)) {
        query = `UPDATE Website SET EntityId = NULL WHERE WebsiteId = "${website_id}"`;
        await execute_query(query);
      }
    }

    for (let website_id of websites) {
      if (!_.includes(default_websites, website_id)) {
        query = `UPDATE Website SET EntityId = "${entity_id}" WHERE WebsiteId = "${website_id}"`;
        await execute_query(query);
      }
    }

    return success(entity_id);
  } catch(err) {
    console.log(err)
    return error(err);
  }
}

module.exports.delete_entity = async (entity_id) => {
  try {
    let query = `UPDATE Website SET EntityId = NULL WHERE EntityId = "${entity_id}"`;
    await execute_query(query);

    query = `DELETE FROM Entity WHERE EntityId = "${entity_id}"`;
    await execute_query(query);

    return success(entity_id);
  } catch(err) {
    console.log(err)
    return error(err);
  }
}