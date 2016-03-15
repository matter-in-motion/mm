'use strict';
const errors = require('../errors');

let fillWithSpace = function(el) {
  if (el === undefined || el === null) {
    return '';
  }

  return el;
}

let encode = function(data) {
  let msg = [ data.call || '' ];

  if (!(data.body === undefined || data.body === null)) {
    msg[1] = data.body;
  }

  if (data.head) {
    msg[2] = data.head;
  }

  if (!(data.id === undefined || data.id === null)) {
    msg[3] = data.id;
  }

  return msg.map(fillWithSpace);
}

let decode = function(msg, opts) {
  if (typeof msg === 'string') {
    if (opts.limit && msg.length > opts.limit) {
      return errors.RequestTooLarge();
    }

    try {
      msg = JSON.parse(msg);
    } catch (e) {
      return errors.RequestDecode(undefined, e.toString());
    }
  }

  if (opts.onlyData) {
    return msg === undefined ? null : msg;
  }

  return {
    call: msg[0],
    body: msg[1] === undefined ? null : msg[1],
    head: msg[2],
    id: msg[3]
  }
}

module.exports = { encode, decode };
