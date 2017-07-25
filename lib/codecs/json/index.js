'use strict';
const errors = require('../../errors');

const fillWithSpace = function(el) {
  if (el === undefined || el === null) {
    return '';
  }

  return el;
}

const Codec = function(opts) {
  this.limit = opts.bodyLimit;
  this.encoding = opts.encoding;
}

Codec.prototype = {
  encode: function(msg, data) {
    if (msg.objectMode) {
      msg.response = this._encode(msg, data);
      return msg;
    }

    try {
      msg.response = JSON.stringify(this._encode(msg, data));
    } catch (e) {
      msg.response = JSON.stringify(this._encode(msg, { call: errors.ResponseEncodeError(e) } ));
    }

    return msg;
  },

  _encode: function(msg, data) {
    let response = [ data.call || '' ];

    if (!(data.body === undefined || data.body === null)) {
      response[1] = data.body;
    }

    if (data.meta) {
      response[2] = data.meta;
    }

    if (!(msg.id === undefined || msg.id === null)) {
      response[3] = msg.id;
    }

    return response.map(fillWithSpace);
  },

  decode: function(msg) {
    const isPacked = msg.body;
    const body = this._decode(msg);

    if (body instanceof Error) {
      msg.error = msg.body
      return msg;
    }

    if (isPacked) {
      msg = Object.assign(msg, {
        call: body[0],
        request: body[1] === undefined ? null : body[1],
        meta: body[2],
        id: body[3]
      });
    } else if (body) {
      msg.request = body;
    }

    return msg;
  },

  _decode: function(msg) {
    const body = msg.body !== undefined ? msg.body : msg.request;
    delete msg.body;

    if (typeof body === 'string') {
      if (this.limit && body.length > this.limit) {
        return errors.RequestTooLarge();
      }

      try {
        return body ? JSON.parse(body) : undefined;
      } catch (e) {
        return errors.RequestDecode(undefined, e.toString());
      }
    }

    return body;
  }
};

module.exports = Codec;
