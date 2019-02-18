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

const { generate_hash } = require('./_security');
const { write_file } = require('./_util');

/**
 * PRIVATE FUNCTIONS
 */

function correct_url(url, https, www) {
  url = _.replace(url, 'http://', '');
  url = _.replace(url, 'https://', '');
  url = _.replace(url, 'www.', '');

  if (www) {
    if (https) {
      url = 'https://www.' + url;
    } else {
      url = 'http://www.' + url;
    }
  } else {
    if (https) {
      url = 'https://' + url;
    } else {
      url = 'http://' + url;
    }
  }

  const myUrl = URL.parse(url);
  
  return myUrl.protocol + '//' + myUrl.hostname + myUrl.pathname;
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

function execute_evaluation(url, https, www, evaluator='examinator') {
  const config = get_evaluator_config(evaluator);

  if (config.language === 'js') {
    const js_evaluator = require(`${__dirname}/../evaluators/${evaluator}/${config.main}`); 
    return js_evaluator.init(url);
  } else {
    return new Promise((resolve, reject) => {
      exec(get_evaluator_execution_command(correct_url(url, https, www), evaluator, config), {maxBuffer: 1024 * 1024}, (error, stdout, stderr) => {
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

function execute_html_evaluation(file, evaluator='examinator') {
  const config = get_evaluator_config(evaluator);


  return new Promise((resolve, reject) => {
    exec(`${config.command} ${__dirname}/../evaluators/${evaluator}/${config.main} "html" "${file}"`, {maxBuffer: 1024 * 1024}, (error, stdout, stderr) => {
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

module.exports.execute_url_evaluation = async (url, evaluator) => {
  let evaluation = null;
  let success = false;
  let _error = null;

  let www = true;
  let https = true;
  let exit = false;

  while(!exit) {
    if (!success) {
      try {
        evaluation = await execute_evaluation(url, https, www, evaluator);
        success = true;
        exit = true;
      } catch(err) {
        console.log(err);
        _error = err;
        
        if (https && www) {
          www = false;
        } else if (https && !www) {
          https = false;
          www = true;
        } else if (!https && www) {
          www = false;
        } else {
          exit = true;
        }
      }
    }
  }

  if (success) {
    return parse_evaluation(evaluation);
  } else {
    return error(_error);
  }
}

module.exports.execute_html_evaluation = async (html, evaluator) => {
  try {
    const fileHash = generate_hash(html);
    const path = `${__dirname}/../evaluators/${evaluator}/${fileHash}.html`;
    await write_file(path, html);
    const evaluation = await execute_html_evaluation(fileHash, evaluator);

    return parse_evaluation(evaluation);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}