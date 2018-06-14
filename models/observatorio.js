"use strict";

/**
 * Observatorio Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const Response = require('../lib/_response');
const Database = require('../lib/_database');

module.exports.get_data = async () => {
  const query = `
    SELECT
      e.EvaluationId,
      e.Title,
      e.Score,
      e.Errors,
      e.A,
      e.AA,
      e.AAA,
      e.Evaluation_Date,
      p.PageId,
      p.Uri,
      p.Creation_Date as Page_Creation_Date,
      d.Url,
      w.WebsiteId,
      w.Name as Website_Name,
      w.Creation_Date as Website_Creation_Date,
      en.Long_Name as Entity_Name,
      t.TagId,
      t.Name as Tag_Name,
      t.Show_in_Observatorio,
      t.Creation_Date as Tag_Creation_Date
    FROM
      Evaluation as e,
      Page as p,
      Domain as d,
      Website as w
      LEFT OUTER JOIN Entity as en ON en.EntityId = w.EntityId,
      TagWebsite as tw,
      Tag as t
    WHERE
      t.Show_in_Observatorio = 1 AND
      tw.TagId = t.TagId AND
      w.WebsiteId = tw.WebsiteId AND
      d.WebsiteId = w.WebsiteId AND
      d.Active = 1 AND
      p.DomainId = d.DomainId AND
      e.PageId = p.PageId`;

  const data = await Database.execute(query);

  return Response.success(data);
}

