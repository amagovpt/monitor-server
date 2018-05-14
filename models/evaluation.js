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
const constants = require('../lib/_constants');
const Response = require('../lib/_response');
const Evaluator = require('../lib/_api');

function correct_url(url) {
  if (_.startsWith(url, 'http:') || _.startsWith(url, 'https:'))
    return url;

  return 'http://' + url;
}

module.exports.evaluate_url = (url, engine) => {
  return new Promise((resolve, reject) => {
    exec(Evaluator.get_command(engine) + ' ' + correct_url(url), {maxBuffer: 1024 * 1024}, (error, stdout, stderr) => {
      if (error) {
        console.log(error);
        reject(error);
      }
      else if (stderr) {
        console.log(stderr); 
        reject(stderr);
      }
      else 
        resolve(Response.success(_.trim(stdout)));
    });
  });
}