'use strict';

const {
  exec
} = require('child_process');
const {
  EvalError,
  InvalidUrlError
} = require('./_error');
const _ = require('lodash');
const config = require('../evaluators/config.json');

const evaluators = {};
var _default;

module.exports.init = () => {
  for (const engine of config.evaluators || []) {
    evaluators[engine] = require(`../evaluators/${engine}/config.json`);

    if (engine === config.default) {
      _default = engine;
    }

    if (evaluators[engine].language === 'js') {
      evaluators[engine].run = async (...params) => {
        return require(`../evaluators/${engine}/${evaluators[engine].main}`).init(params);
      }
    } else {
      evaluators[engine].run = async (...params) => {
        return new Promise((resolve, reject) => {
          exec(`${evaluators[engine].command} ${__dirname}/../evaluators/${engine}/${evaluators[engine].main} ${_.replace(params, ',', ' ')}`, {
            maxBuffer: 1024 * 1024 * 10
          }, (error, stdout, stderr) => {
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
  }
}

module.exports.run_evaluator = async (evaluator, ...params) => {
  if (!evaluators[evaluator]) {
    evaluator = _default;
  }
  return evaluators[evaluator].run(params);
}