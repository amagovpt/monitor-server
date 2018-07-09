'use strict';

/**
 * Evaluation Model
 */

/**
 * Libraries and modules
 */
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
    const evaluation = JSON.parse(await execute_evaluation(url, 'examinator'));

    const webpage = Buffer.from(evaluation.pagecode).toString('base64');
    const data = evaluation.data;

    const conform = _.split(data.conform, '@');

    const query = `
      INSERT INTO 
        Evaluation (PageId, Title, Score, Pagecode, Tot, Nodes, Errors, A, AA, AAA, Evaluation_Date)
      VALUES 
        ("${id}", "${data.title}", "${data.score}", "${webpage}", "${Buffer.from(JSON.stringify(data.tot)).toString('base64')}", 
        "${Buffer.from(JSON.stringify(data.nodes)).toString('base64')}", "${Buffer.from(JSON.stringify(data.elems)).toString('base64')}", "${conform[0]}", 
        "${conform[1]}", "${conform[2]}", "${data.date}")`;

    await execute_query(query);
    return success();
  } catch(err) {
    return error(err);
  }
}