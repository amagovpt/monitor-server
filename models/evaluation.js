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
const Middleware = require('../lib/_middleware');

function correct_url(url) {
  if (_.startsWith(url, 'http:') || _.startsWith(url, 'https:'))
    return url;

  return 'http://' + url;
}

module.exports.evaluate_url = async (url, engine) => {
  const data = await Middleware.evaluate_and_process(url, engine);
  if (data) {
    return Response.success(data);
  } else {
    return Response.error(-2, 'Invalida url or webpage doesn\'t exist');
  }
}

module.exports.get_elements = (url, element, engine) => {
  return new Promise((resolve, reject) => {
    let command = (Middleware.get_command(engine) + ' 2 ' + correct_url(url) + ' ' + element).toString();
    console.log(command)
    exec(command, {maxBuffer: 1024 * 1024}, (error, stdout, stderr) => {
      if (error) {
        reject(Response.error(-1, 'ERROR_EXECUTING', error));
      }
      else if (stderr) {
        reject(Response.error(-2, 'ERROR_EXECUTING_2', stderr));
      }
      else 
        resolve(Response.success(_.trim(stdout)));
    });
  });
}

module.exports.evaluate_and_save = async (id, url) => {
  const evaluation = JSON.parse(await Middleware.evaluate(url, 'examinator'));

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

  Database.execute(query);
  return;
}