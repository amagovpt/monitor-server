'use strict';

const Qualweb = require('../../../../qualweb/qualweb-server/src/core');

module.exports.init = params => {
  return Qualweb.run({
    '--act': '',
    '--html': '',
    '-htech': 'h37,h45,h24,h35,h36',
    '-url': params[0],
    '--save': 'json,earl'
  }, true);
}