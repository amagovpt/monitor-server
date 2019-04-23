'use strict';

const { writeFile } = require('fs');

module.exports.write_file = async (path, data) => {
  return new Promise((resolve, reject) => {
    writeFile(path, data, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}