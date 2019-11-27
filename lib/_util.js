'use strict';

const { writeFile, stat, access } = require('fs');
const socketIo = require('socket.io');

var io;
var _server;

module.exports.write_file = (path, data) => {
  return new Promise((resolve, reject) => {
    writeFile(path, data, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports.file_exists = path => {
  return new Promise((resolve, reject) => {
    access(path, err => {
      if (err) resolve(false);
      else resolve(true);
    });
  });
}

module.exports.get_file_stats = path => {
  return new Promise((resolve, reject) => {
    stat(path, (err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
}

module.exports.createSocketIoServer = server => {
  /*if (!io) {
    io = socketIo(server);
  }*/
  _server = server;
}

module.exports.get_io = () => {
  //return io;
  return socketIo(_server);
}