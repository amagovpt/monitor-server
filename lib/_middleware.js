'use strict';

/**
 * Evaluators API module
 */

const exec = require('child_process').exec;
const _ = require('lodash');
const Promise = require('promise');
const URL = require('url');
const config = require('../evaluators/config.json');
const { EvalError, InvalidUrlError } = require('./_error');
const { error } = require('../lib/_response');

/**
 * PRIVATE FUNCTIONS
 */

function correct_url(url, www) {
  url = _.replace(url, 'http://', '');
  url = _.replace(url, 'https://', '');
  url = _.replace(url, 'www.', '');

  if (www) {
    url = 'http://www.' + url;
  } else {
    url = 'http://' + url;
  }

  const myUrl = URL.parse(url);
  return myUrl.hostname + myUrl.pathname;
}

function get_evaluator_config(evaluator) {
  if (!_.includes(config.evaluators, evaluator)) {
    evaluator = 'examinator';
  }

  return require(__dirname + '/../evaluators/' + evaluator + '/config.json');
}

function get_evaluator_execution_command(url, evaluator, config) {
  return `${config.command} ${__dirname}/../evaluators/${evaluator}/${config.main} ${url}`;
}

function execute_evaluation(url, www, evaluator='examinator') {
  const config = get_evaluator_config(evaluator);

  if (config.language === 'js') {
    const js_evaluator = require(`${__dirname}/../evaluators/${evaluator}/${config.main}`); 
    return js_evaluator.init(url);
  } else {
    return new Promise((resolve, reject) => {
      exec(get_evaluator_execution_command(correct_url(url, www), evaluator, config), {maxBuffer: 1024 * 1024}, (error, stdout, stderr) => {
        if (error || stderr) {
          reject(new EvalError(error || stderr));
        } else if (stdout === 'null' || _.trim(stdout) === '') {
          reject(new InvalidUrlError(stdout));
        } else {
          resolve(_.trim(stdout));
        }
      });
    });
  }
}

function parse_evaluation(evaluation) {
  try {
    evaluation = JSON.parse(evaluation);
    evaluation.pagecode = Buffer.from(evaluation.pagecode, 'base64').toString();
    const tests = require('./tests.json');
    const tests_colors = require('./tests_colors.json');
    let errors = { A: 0, AA: 0, AAA: 0};
    for (let ee in evaluation.data.tot.results) {
      if (ee) {
        let level = _.toUpper(tests[ee]['level']);
        if (tests_colors[ee] === 'R') { 
          errors[level]++;
        }
      }
    }
    evaluation.data.conform = `${errors.A}@${errors.AA}@${errors.AAA}`;
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
  let evaluation = null;
  let success = false;
  let _error = null;

  try {
    evaluation = await execute_evaluation(url, false, evaluator);
    success = true;
  } catch(err) {
    console.log(err);
    success = false;
    _error = err;
  }

  if (!success) {
    try {
      evaluation = await execute_evaluation(url, true, evaluator);
      success = true;
    } catch(err) {
      console.log(err);
      success = false;
      _error = err;
    }
  }
  if (success) {
    return parse_evaluation(evaluation);
  } else {
    return error(_error);
  }
}