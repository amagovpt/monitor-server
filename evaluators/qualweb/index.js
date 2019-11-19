'use strict';

const core = require('@qualweb/core');

module.exports.init = async params => {
  const report = (await core.evaluate({
    url: params[0],
    execute: {
      act: true,
      html: true,
      css: true,
      bp: true
    }
  }))[0];
  const earlReport = (await core.generateEarlReport())[0];
  
  return { report, earlReport };
}