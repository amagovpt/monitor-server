"use strict";

/**
 * Evaluators API module
 */

const exec = require('child_process').exec;
const _ = require('lodash');
const config = require('../evaluators/config.json');

module.exports.get_command = (_evaluator='examinator') => {
  if (_.includes(config.evaluators, _evaluator)) {
    const eval_config = require('../evaluators/' + _evaluator + '/config.json');
    return eval_config.command + ' ' + __dirname + '/../evaluators/' + _evaluator + '/' + eval_config.main;
  } else {
    const eval_config = require('../evaluators/examinator/config.json');
    return eval_config.command + ' ' + __dirname + '/../evaluators/examinator/' + eval_config.main;
  }
} 