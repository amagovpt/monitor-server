'use strict';

/**
 * Evaluators API module
 */

const exec = require('child_process').exec;
const _ = require('lodash');
const Promise = require('promise');
const config = require('../evaluators/config.json');
const { EvalError, InvalidUrlError } = require('./_error');
const { error } = require('../lib/_response');

/**
 * PRIVATE FUNCTIONS
 */

function correct_url(url) {
  url = _.replace(url, 'http://', '');
  url = _.replace(url, 'https://', '');
  url = _.replace(url, 'www.', '');

  return 'http://' + url;
}

function get_evaluator_config(evaluator) {
  if (!_.includes(config.evaluators, evaluator)) {
    evaluator = 'examinator';
  }

  return require(__dirname + '/../evaluators/' + evaluator + '/config.json');
}

function get_evaluator_execution_command(url, evaluator, config) {
  return `${config.command} ${__dirname}/../evaluators/${evaluator}/${config.main} ${correct_url(url)}`;
}

function execute_evaluation(url, evaluator='examinator') {
  const config = get_evaluator_config(evaluator);

  if (config.language === 'js') {
    const js_evaluator = require(`${__dirname}/../evaluators/${evaluator}/${config.main}`); 
    return js_evaluator.init(url);
  } else {
    return new Promise((resolve, reject) => {
      exec(get_evaluator_execution_command(url, evaluator, config), {maxBuffer: 1024 * 1024}, (error, stdout, stderr) => {
        if (error || stderr) {
          reject(new EvalError(error || stderr));
        } else if (stdout === 'null') {
          reject(new InvalidUrlError(stdout));
        }
        else {
          resolve(_.trim(stdout));
        }
      });
    });
  }
}

function parse_evaluation(evaluation) {
  try {
    return evaluation;
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

/**
 * PUBLIC FUNCTIONS
 */

module.exports.execute_evaluation = async (url, evaluator) => {
  try {
    const evaluation = await execute_evaluation(url, evaluator);
    return parse_evaluation(evaluation);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}