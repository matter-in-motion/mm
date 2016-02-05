'use strict';
const http = require('./http');
const ws = require('./ws');
const codec = require('./codec');

module.exports = {
  http,
  ws,
  encode: codec.encode,
  decode: codec.decode
};
