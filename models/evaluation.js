'use strict';

/**
 * Evaluation Model
 */

/**
 * Libraries and modules
 */
const { split } = require('lodash');
const { success, error } = require('../lib/_response');
const { execute_query } = require('../lib/_database');
const { execute_evaluation } = require('../lib/_middleware');

module.exports.evaluate_url = async (url, evaluator) => {
  try {
    const evaluation = await execute_evaluation(url, evaluator);
    return success(JSON.parse(evaluation));
  } catch(err) {
    return error(err);
  }
}

module.exports.evaluate_url_and_save = async (page_id, url) => {
  try {
    let evaluation = await execute_evaluation(url, 'examinator');
    evaluation = JSON.parse(evaluation);

    const webpage = Buffer.from(evaluation.pagecode).toString('base64');
    const data = evaluation.data;

    const conform = split(data.conform, '@');
    const tot = Buffer.from(JSON.stringify(data.tot)).toString('base64');
    const nodes = Buffer.from(JSON.stringify(data.nodes)).toString('base64');
    const elems = Buffer.from(JSON.stringify(data.elems)).toString('base64');

    const query = `
      INSERT INTO 
        Evaluation (PageId, Title, Score, Pagecode, Tot, Nodes, Errors, A, AA, AAA, Evaluation_Date)
      VALUES 
        ("${page_id}", "${data.title}", "${data.score}", "${webpage}", "${tot}", "${nodes}", "${elems}", "${conform[0]}", 
         "${conform[1]}", "${conform[2]}", "${data.date}")`;

    await execute_query(query);
    return success(evaluation);
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.get_newest_evaluation = async (user_id, tag, website, url) => {
  try {
    const query = `SELECT e.* 
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d,
        DomainPage as dp,
        Page as p,
        Evaluation as e
      WHERE
        t.Name = "${tag}" AND
        t.UserId = "${user_id}" AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.Name = "${website}" AND
        w.UserId = "${user_id}" AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        p.Uri = "${url}" AND 
        e.PageId = p.PageId
      ORDER BY e.Evaluation_Date DESC 
      LIMIT 1`;
    let evaluation = await execute_query(query);
    evaluation = evaluation[0];
    
    const tot = JSON.parse(Buffer.from(evaluation.Tot, 'base64').toString());

    return success(
      { pagecode: Buffer.from(evaluation.Pagecode, 'base64').toString(),
        data: {
          title: evaluation.Title,
          score: evaluation.Score,
          rawUrl: url,
          tot: tot,
          nodes: JSON.parse(Buffer.from(evaluation.Nodes, 'base64').toString()),
          conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
          elems: tot.elems,
          date: evaluation.Evaluation_Date
    }});
  } catch(err) {
    console.log(err);
    throw error(err);
  }
} 