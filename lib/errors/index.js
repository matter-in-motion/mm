'use strict';
const core = require('./core');
const badRequest = require('./bad_request');

let errors = {
  WebError: core.WebError,
  BadRequest: core.BadRequest,
  AuthRequired: core.AuthRequired,
  Forbidden: core.Forbidden,
  NotFound: core.NotFound,
  MethodNotAllowed: core.MethodNotAllowed,
  Conflict: core.Conflict,
  RequestEntityTooLarge: core.RequestEntityTooLarge,
  UnsupportedMediaType: core.UnsupportedMediaType,
  ServerError: core.ServerError,

  MessageFormatError: badRequest.MessageFormatError,
  ParseError: badRequest.ParseError,
  HeadersParseError: badRequest.HeadersParseError,
  ValidationError: badRequest.ValidationError
};


let isEmpty = function(something) {
  if (!something) {
    return true;
  }

  return typeof something === 'object' && !Object.keys(something).length;
};

errors.handler = function(ErrorClass, retName, cb) {
  if (typeof ErrorClass === 'string') {
    ErrorClass = errors[ErrorClass];
  }

  if (typeof retName === 'function') {
    cb = retName;
    retName = undefined;
  }

  return function(err, result) {
    if (err) {
      cb(new ErrorClass(err.message));
    } else if (retName !== undefined) {
      var ret = {};
      if (typeof retName === 'string') {
        ret[retName] = result;
      } else {
        ret = retName;
      }
      cb(null, ret);
    } else if (isEmpty(result) && ErrorClass) {
      cb(new ErrorClass());
    } else {
      cb(null, result);
    }
  };
};

module.exports = errors;
