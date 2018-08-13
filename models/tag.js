'use strict';

/**
 * Tag Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const { InvalidTagTypeError } = require('../lib/_error');
const { success, error } = require('../lib/_response');
const { execute_query } = require('../lib/_database');
const { evaluate_url_and_save } = require('./evaluation');

module.exports.create_official_tag = async (name, observatorio, websites) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let query = `INSERT INTO Tag (Name, Show_in_Observatorio, Creation_Date) 
      VALUES ("${name}", "${observatorio}", "${date}")`;
    
    const tag = await execute_query(query);
    
    for (let w of websites) {
      query = `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES ("${tag.insertId}", "${w}")`;
      await execute_query(query);
    }

    return success(tag.insertId);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.create_user_tag = async (user_id, type, official_tag_id, user_tag_name) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let query = `INSERT INTO Tag (UserId, Name, Show_in_Observatorio, Creation_Date) 
        VALUES ("${user_id}", "${user_tag_name}", "0", "${date}")`;

    const tag = await execute_query(query);

    if (type === 'official') {
      query = `SELECT PageId FROM TagPage WHERE TagId = "${official_tag_id}"`;
      const tags = await execute_query(query);

      for (let i = 0 ; i < tags.length ; i++) {
        let _tag = tags[i];
        query = `INSERT INTO TagPage (TagId, PageId) VALUES ("${tag.insertId}", "${_tag.PageId}")`;
        await execute_query(query);
      }
    } else if (type !== 'user') {
      throw new InvalidTagTypeError(err); 
    }

    return success(tag.insertId);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

/**
 * Get functions
 */

module.exports.tag_official_name_exists = async (name) => {
  try {
    const query = `SELECT * FROM Tag WHERE Name = "${name}" AND UserId IS NULL LIMIT 1`;
    const tag = await execute_query(query);
    return success(_.size(tag) === 1);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_tags = async () => {
  try {
    const query = `SELECT 
        t.*,
        u.Email as User,
        COUNT(distinct tw.WebsiteId) as Websites 
      FROM 
        Tag as t
        LEFT OUTER JOIN User as u ON u.UserId = t.UserId
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
      GROUP BY t.TagId`;
    const tags = await execute_query(query);
    return success(tags);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_official_tags = async user_id => {
  try {
    const query = `SELECT t.* 
      FROM 
        Tag as t
      WHERE 
        t.UserId IS NULL AND
        t.Name NOT IN (SELECT Name FROM Tag as t2 WHERE t2.UserId = "${user_id}")`;
    const tags = await execute_query(query);
    return success(tags);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_tags_info = async () => {
  try {
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
    
    const tags = await execute_query(query);
    return success(tags);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_access_studies_user_tags = async user_id => {
  try {
    const query = `SELECT 
        distinct t.*, 
        COUNT(distinct tw.WebsiteId) as Websites,
        COUNT(distinct dp.PageId) as Pages 
      FROM 
        Tag as t
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
        LEFT OUTER JOIN Domain as d ON d.WebsiteId = tw.WebsiteId
        LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
      WHERE 
        t.UserId = "${user_id}"
      GROUP BY t.TagId`;
    const tags = await execute_query(query);
    return success(tags);
  } catch(err) {
    return error(err);
  }
}

module.exports.user_tag_name_exists = async (user_id, name) => {
  const query = `SELECT * FROM Tag WHERE Name = "${name}" AND UserId = "${user_id}" LIMIT 1`;
  const tag = await execute_query(query);
  return success(_.size(tag) !== 0);
}

module.exports.user_remove_tags = async (user_id, tagsId) => {
  try {
    const _delete = _.map(tagsId, id => id+'');
    let query = `DELETE
        w.*
      FROM
        Website as w
      WHERE
        w.WebsiteId IN (SELECT WebsiteId FROM TagWebsite WHERE TagId IN (${_delete}))`;
    await execute_query(query);

    query = `DELETE FROM Tag WHERE TagId IN (${_delete})`;
    await execute_query(query);

    return await get_user_tags(user_id);
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}