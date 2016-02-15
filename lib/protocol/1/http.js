'use strict';
const codec = require('./codec');
const encode = codec.encode;
const decode = codec.decode;
const getRawBody = require('raw-body');

const rxForms = /^multipart\/(?:form-data|related)(?:;|$)/i;

let request = function(opts) {
  return function(req, res, next) {
    req.body = {
      call: req.get('X-MMCall'),
      token: req.get('X-MMAuth'),
      id: req.get('X-MMId')
    }

    if (req.method === 'GET') {
      req.body.data = req.query.d ? decode(req.query.d, { limit: opts.limit, onlyData: true }) : null;
      return next();
    }

    //other methods
    //first check in case there are files
    if (rxForms.test(req.get('content-type'))) {
      //parse data part in your controller
      //to get raw req object as data use raw  option in your schema
      return next();
    }
    //

    getRawBody(req, {
      length: req.get('content-length'),
      limit: opts.limit,
      encoding: opts.encoding
    }, function(err, string) {
      if (err) {
        req.body = err;
        return next();
      }
      console.log('body:', string);
      req.body.data = string ? decode(string, { onlyData: true }) : null;
      next();
    });
  }
}

let response = function(res, data) {
  let response = encode(data);
  if (response instanceof Error) {
    response = encode({
      call: response,
      id: data.id,
      token: data.token
    });
  }

  res
    .status(200)
    .set('content-type', 'application/json')
    .send(response);
}

module.exports = { request, response }
