'use strict';

const Promise = require('promise');
const fs = require('fs');

module.exports.write_file = async (path, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}