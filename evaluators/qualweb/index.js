'use strict';

const Qualweb = require('../../../../qualweb/qualweb-server/src/core');

module.exports.init = params => {
  return Qualweb.run({
    '--act': '',
    '-url': params[0],
    '--save': 'json,earl'
  }, true);
}