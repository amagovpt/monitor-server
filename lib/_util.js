'use strict';

const { writeFile } = require('fs');
const socketIo = require('socket.io');

var io;

module.exports.write_file = async (path, data) => {
  return new Promise((resolve, reject) => {
    writeFile(path, data, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports.createSocketIoServer = server => {
  if (!io) {
    io = socketIo(server);
  }
}

module.exports.get_io = () => {
  return io;
}