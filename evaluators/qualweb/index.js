'use strict';

const qualweb = require(__dirname + '/../../../qualweb/qualweb_server/core');

module.exports.init = async (url) => {
  const check = {
    '--html': '',
    '-url': encodeURIComponent(url)
  };
  const evaluation = await qualweb.run(check, true);
  
  return evaluation;
}