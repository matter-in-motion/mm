'use strict';
const ResponseEncodeError = require('../errors').ResponseEncode;
const codec = require('./codec');
const encode = codec.encode;
const decode = codec.decode;

let request = function(opts) {
  return function(connection, message) {
    return decode(message, { limit: opts.limit });
  }
}

let response = function(connection, data, cb) {
  let response = encode(data);

  try {
    response = JSON.stringify(response);
  } catch (e) {
    response = JSON.stringify(encode({
      call: ResponseEncodeError(e),
      id: data.id
    }));
  }

  connection.send(response, cb);
}

module.exports = { request, response };
