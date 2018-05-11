"use strict";

/**
 * Evaluators API module
 */

const exec = require('child_process').exec;
const _ = require('lodash');
const config = require('../evaluators/config.json');

module.exports.get_command = function(_evaluator='examinator') {
  const path = '../evaluators/examinator/config.json'
  if (_.includes(config.evaluators, _evaluator)) {
    path = '../evaluators/' + _evaluator + '/config.json';
  }

  const eval_config = require(path);
  return 'C:/xampp/php/php.exe ' + eval_config.main;
} 