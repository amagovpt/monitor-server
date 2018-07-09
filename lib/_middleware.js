'use strict';

/**
 * Evaluators API module
 */

const exec = require('child_process').exec;
const _ = require('lodash');
const Promise = require('promise');
const config = require('../evaluators/config.json');
const { EvalError, InvalidUrlError } = require('./_error');

/**
 * PRIVATE FUNCTIONS
 */

function correct_url(url) {
  url = _.replace(url, 'http://', '');
  url = _.replace(url, 'https://', '');

  return 'http://' + url;
}

function get_evaluator_execution_command(url, evaluator='examinator') {
  if (!_.includes(config.evaluators, evaluator)) {
    evaluator = 'examinator';
  }

  const eval_config = require('../evaluators/' + evaluator + '/config.json');
  return `${eval_config.command} ${__dirname}/../evaluators/${evaluator}/${eval_config.main} ${correct_url(url)}`;
}

/**
 * PUBLIC FUNCTIONS
 */

module.exports.execute_evaluation = (url, evaluator) => {
  return new Promise((resolve, reject) => {
    exec(get_evaluator_execution_command(url, evaluator), {maxBuffer: 1024 * 1024}, (error, stdout, stderr) => {
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