"use strict";

/**
 * Page Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const Response = require('../lib/_response');
const Database = require('../lib/_database');

module.exports.create = async (domainId, uri, tags) => {
  let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

  let query = `INSERT INTO Page (DomainId, Uri, Creation_Date) 
    VALUES ("${domainId}", "${uri}", "${date}")`;
  
  const res = await Database.execute(query);

  let size = _.size(tags);
  for(let i = 0 ; i < size ; i++) {
    query = `INSERT INTO TagPage (TagId, PageId) VALUES ("${tags[i]}", "${res.insertId}")`;
    await Database.execute(query);
  }

  return res.insertId;
}

module.exports.all = async () => {
  const query = `SELECT p.* FROM Page as p, Domain as d
    WHERE d.DomainId = p.PageId AND d.Active = "1"`;
  
  const pages = await Database.execute(query);
  return Response.success(pages);
}

module.exports.all_info = async () => {
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
  
  const pages = await Database.execute(query);
  return Response.success(pages);
}
