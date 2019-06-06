'use strict';

const Qualweb = require('../../../../qualweb/qualweb-server/src/core');

module.exports.init = url => {
  return Qualweb.run({
    '--act': '',
    '-url': url,
    '--save': 'json,earl'
  }, true);
}