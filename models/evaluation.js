"use strict";

/**
 * Evaluation Model
 */

/**
 * Libraries and modules
 */
const exec = require('child_process').exec;
const _ = require('lodash');
const Promise = require('promise');
const Database = require('../lib/_database');
const Response = require('../lib/_response');
const Evaluator = require('../lib/_api');

function correct_url(url) {
  if (_.startsWith(url, 'http:') || _.startsWith(url, 'https:'))
    return url;

  return 'http://' + url;
}

function evaluate(url, engine) {
  return new Promise((resolve, reject) => {
    exec(Evaluator.get_command(engine) + ' ' + correct_url(url), {maxBuffer: 1024 * 1024}, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      else if (stderr) {
        reject(stderr);
      }
      else 
        resolve(_.trim(stdout));
    });
  });
}

module.exports.evaluate_url = (url, engine) => {
  return new Promise((resolve, reject) => {
    exec(Evaluator.get_command(engine) + ' ' + correct_url(url), {maxBuffer: 1024 * 1024}, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      else if (stderr) {
        reject(stderr);
      }
      else 
        resolve(Response.success(_.trim(stdout)));
    });
  });
}

module.exports.evaluate_and_save = async (id, url) => {
  const evaluation = JSON.parse(await evaluate(url, 'examinator'));

  const webpage = Buffer.from(evaluation.pagecode).toString('base64');
  const data = evaluation.data;

  const conform = _.split(data[6], '@');

  const query = `
    INSERT INTO 
      Evaluation (PageId, Title, Score, Pagecode, Tot, Nodes, Errors, A, AA, AAA, Evaluation_Date)
    VALUES 
      ("${id}", "${data[0]}", "${data[1]}", "${webpage}", "${Buffer.from(JSON.stringify(data[4])).toString('base64')}", 
      "${Buffer.from(JSON.stringify(data[5])).toString('base64')}", "${Buffer.from(JSON.stringify(data[7])).toString('base64')}", "${conform[0]}", 
      "${conform[1]}", "${conform[2]}", "${data[8]}")`;

  await Database.execute(query);

  return;
}