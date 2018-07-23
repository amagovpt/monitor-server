'use strict';

/**
 * Tag Model
 */

/**
 * Libraries and modules
 */
const { size, join, map } = require('lodash');
const { InvalidTagTypeError } = require('../lib/_error');
const { success, error } = require('../lib/_response');
const { execute_query } = require('../lib/_database');
const { evaluate_url_and_save } = require('./evaluation');

module.exports.create_tag = async (name, observatorio, entities, websites, domains, pages) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let query = `INSERT INTO Tag (Name, Show_in_Observatorio, Creation_Date) 
      VALUES ("${name}", "${observatorio?1:0}", "${date}")`;
    
    const tag = await execute_query(query);

    let size = size(entities);
    for (let i = 0 ; i < size ; i++) {
      query = `INSERT INTO TagEntity (TagId, EntityId) VALUES ("${tag.insertId}", "${entities[i]}")`;
      await execute_query(query);
    }

    size = size(websites);
    for (let i = 0 ; i < size ; i++) {
      query = `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES ("${tag.insertId}", "${websites[i]}")`;
      await execute_query(query);
    }

    size = size(domains);
    for (let i = 0 ; i < size ; i++) {
      query = `INSERT INTO TagDomain (TagId, DomainId) VALUES ("${tag.insertId}", "${domains[i]}")`;
      await execute_query(query);
    }

    size = size(pages);
    for (let i = 0 ; i < size ; i++) {
      query = `INSERT INTO TagPage (TagId, PageId) VALUES ("${tag.insertId}", "${pages[i]}")`;
      await execute_query(query);
    }

    return success(tag.insertId);
  } catch(err) {
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
    return success(size(tag) === 1);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_tags = async () => {
  try {
    const query = `SELECT * FROM Tag`;
    const tags = await execute_query(query);
    return success(tags);
  } catch(err) {
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
    const query = `SELECT t.*, COUNT(distinct tp.PageId) as Pages FROM Tag as t
      LEFT OUTER JOIN TagPage as tp ON tp.TagId = t.TagId
      WHERE UserId = "${user_id}"
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
  return success(size(tag) !== 0);
}

module.exports.add_user_tag_pages = async (user_id, tag, urls) => {
  try {
    let query = `SELECT TagId FROM Tag WHERE Name = "${tag}" AND UserId = "${user_id}"`;
    let _tag = await execute_query(query);

    if (size(_tag) === 0) {
      throw InvalidTagTypeError(_tag);
    }

    _tag = _tag[0];

    const _size = size(urls);
    for (let i = 0 ; i < _size ; i++) {
      query = `SELECT PageId FROM Page WHERE Uri = "${urls[i]}" LIMIT 1`;
      let page = await execute_query(query);

      if (size(page) > 0) {
        query = `SELECT tp.* FROM TagPage as tp, Tag as t WHERE t.Name = "${_tag.Name}" AND tp.TagId = t.TagId AND tp.PageId = "${page[0].PageId}"`;
        let tagPage = await execute_query(query);
        if (size(tagPage) === 0) {
          query = `INSERT INTO TagPage (TagId, PageId) VALUES ("${_tag.TagId}", "${page[0].PageId}")`;
          await execute_query(query);
        }
      } else {
        let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        query = `INSERT INTO Page (Uri, Creation_Date) VALUES ("${urls[i]}", "${date}")`;
        let newPage = await execute_query(query);
        
        await evaluate_url_and_save(newPage.insertId, urls[i]);

        query = `INSERT INTO TagPage (TagId, PageId) VALUES ("${_tag.TagId}", "${newPage.insertId}")`;
        await execute_query(query);
      }
    }

    query = `SELECT 
        distinct p.*,
        e.Score,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date
      FROM 
        Page as p,
        Tag as t,
        TagPage as tp,
        User as u,
        Evaluation as e
      WHERE
        t.Name = "${tag}" AND
        t.UserId = "${user_id}" AND
        tp.TagId = t.TagId AND
        p.PageId = tp.PageId AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId);`;
    const pages = await execute_query(query);

    return success(pages);
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.user_remove_tags = async (user_id, tagsId) => {
  try {
    const _delete = map(tagsId, id => id+'');
    let query = `DELETE FROM TagPage WHERE TagId IN (${_delete})`;
    await execute_query(query);

    query = `DELETE FROM Tag WHERE TagId IN (${_delete})`;
    await execute_query(query);

    query = `SELECT t.*, COUNT(distinct tp.PageId) as Pages FROM Tag as t
      LEFT OUTER JOIN TagPage as tp ON tp.TagId = t.TagId
      WHERE UserId = "${user_id}"
      GROUP BY t.TagId`;
    const tags = await execute_query(query);

    return success(tags);
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.user_tag_remove_pages = async (user_id, tag, pagesId) => {
  try {
    const _delete = map(pagesId, id => id+'');
    let query = `DELETE tp.* FROM TagPage as tp, Tag as t 
      WHERE t.Name = "${tag}" AND tp.TagId = t.TagId AND tp.PageId IN (${_delete})`;

    await execute_query(query);

    query = `SELECT 
        distinct p.*,
        e.Score,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date
      FROM 
        Page as p,
        Tag as t,
        TagPage as tp,
        User as u,
        Evaluation as e
      WHERE
        t.Name = "${tag}" AND
        t.UserId = "${user_id}" AND
        tp.TagId = t.TagId AND
        p.PageId = tp.PageId AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId);`;
    const pages = await execute_query(query);

    return success(pages);
  } catch(err) {
    console.log(err);
    throw error(err);
  } 
}