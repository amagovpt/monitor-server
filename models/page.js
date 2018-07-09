'use strict';

/**
 * Page Model
 */

/**
 * Libraries and modules
 */
const { each } = require('async');
const { success, error } = require('../lib/_response');
const { execute_query } = require('../lib/_database');

module.exports.create_page = async (domain_id, uri, tags) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let query = `INSERT INTO Page (DomainId, Uri, Creation_Date) 
      VALUES ("${domain_id}", "${uri}", "${date}")`;
    
    const page = await execute_query(query);

    each(tags, (tag, callback) => {
      query = `INSERT INTO TagPage (TagId, PageId) VALUES ("${tag}", "${page.insertId}")`;
      execute_query(query)
        .then(success => callback())
        .catch(err => callback(err));
    }, err => {
      if (err)
        return error(err);
      else 
        return success(page.insertId);
    });
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_pages = async () => {
  try {
    const query = `SELECT p.* FROM Page as p, Domain as d
      WHERE d.DomainId = p.PageId AND d.Active = "1"`;
    
    const pages = await execute_query(query);
    return success(pages);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_pages_info = async () => {
  try {
    const query = `
      SELECT 
        p.PageId,
        p.Uri,
        w.Name as Website,
        e.Score,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date,
        COUNT(distinct tp.TagId) as Tags
      FROM 
        Page as p
        LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Evaluation_Date = (
          SELECT Evaluation_Date FROM Evaluation 
          WHERE PageId = p.PageId 
          ORDER BY Evaluation_Date DESC LIMIT 1
        )
        LEFT OUTER JOIN TagPage tp ON tp.PageId = p.PageId,
        Domain as d,
        Website as w
      WHERE 
        d.DomainId = p.DomainId AND
        w.WebsiteId = d.WebsiteId
      GROUP BY p.PageId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date`;
    
    const pages = await execute_query(query);
    return success(pages);
  } catch(err) {
    return error(err);
  }
}
