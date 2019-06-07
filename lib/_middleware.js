'use strict';

/**
 * Evaluators API module
 */

const _ = require('lodash');
const URL = require('url');
const { success, error } = require('../lib/_response');

const { generate_hash } = require('./_security');
const { write_file } = require('./_util');
const evaluators = require('./_evaluators');

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

function parse_evaluation(evaluation) {
  try {
    evaluation = JSON.parse(evaluation);
    evaluation.pagecode = Buffer.from(evaluation.pagecode, 'base64').toString();
    const tests = require('./tests.json');
    const tests_colors = require('./tests_colors.json');
    const errors = { A: 0, AA: 0, AAA: 0};
    for (const ee in evaluation.data.tot.results) {
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
  let _success = false;
  let _error = null;
  evaluator = 'axe';
  let www = true;
  let https = true;
  let exit = false;

  while(!exit) {
    if (!_success) {
      try {
        evaluation = await evaluators.run_evaluator(evaluator, [correct_url(url, https, www)]);
        _success = true;
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
  
  if (_success) {
    return success(parse_evaluation(evaluation));
  } else {
    return error(_error);
  }
}

module.exports.execute_html_evaluation = async (html, evaluator) => {
  try {
    const fileHash = generate_hash(html);
    const path = `${__dirname}/../evaluators/${evaluator}/${fileHash}.html`;
    await write_file(path, html);
    const evaluation = await evaluators.run_evaluator(evaluator, ['html', file]);

    return parse_evaluation(evaluation);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}