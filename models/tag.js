'use strict';

/**
 * Tag Model
 */

/**
 * Libraries and modules
 */
const { size } = require('lodash');
const { series, each } = require('async');
const { success, error } = require('../lib/_response');
const { execute_query } = require('../lib/_database');

module.exports.create_tag = async (name, observatorio, entities, websites, domains, pages) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let query = `INSERT INTO Tag (Name, Show_in_Observatorio, Creation_Date) 
      VALUES ("${name}", "${observatorio?1:0}", "${date}")`;
    
    const tag = await execute_query(query);

    series([
      function(entities_callback) {
        each(entities, (entity, callback) => {
          query = `INSERT INTO TagEntity (TagId, EntityId) VALUES ("${tag.insertId}", "${entity}")`;
          execute_query(query)
            .then(success => callback())
            .catch(err => callback(err));
        }, err => {
          if (err)
            entities_callback(err);
          else
            entities_callback();
        });
      },
      function(websites_callback) {
        each(websites, (website, callback) => {
          query = `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES ("${tag.insertId}", "${website}")`;
          execute_query(query)
            .then(success => callback())
            .catch(err => callback(err));
        }, err => {
          if (err)
            websites_callback(err);
          else
            websites_callback();
        });
      },
      function(domains_callback) {
        each(domains, (domain, callback) => {
          query = `INSERT INTO TagDomain (TagId, DomainId) VALUES ("${tag.insertId}", "${domain}")`;
          execute_query(query)
            .then(success => callback())
            .catch(err => callback(err));
        }, err => {
          if (err)
            domains_callback(err);
          else
            domains_callback();
        });
      },
      function(pages_callback) {
        each(pages, (page, callback) => {
          query = `INSERT INTO TagPage (TagId, PageId) VALUES ("${tag.insertId}", "${page}")`;
          execute_query(query)
            .then(success => callback())
            .catch(err => callback(err));
        }, err => {
          if (err)
            pages_callback(err);
          else
            pages_callback();
        });
      }
    ], err => {
      if (err)
        return error(err);
      else
        return success(tag.insertId);
    });
  } catch(err) {
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