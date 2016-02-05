'use strict';

let mmError = function(code, msg, toString) {
  return function(data, message) {
    let err = new Error();
    err.code = code;
    err.message = msg;

    if (message) {
      err.message += '. ' + message;
    }

    if (data) {
      err.data = data;
    }

    if (toString) {
      err.toString = toString;
    }

    return err;
  }
}

const Call                = mmError(4000, 'Error'); //general error to return from your methods
const Unauthorized        = mmError(4100, 'Unauthorized');
const TokenExpired        = mmError(4110, 'Token expired');
const RequestValidation   = mmError(4200, 'Request validation failed');
const ResponseValidation  = mmError(4210, 'Response validation failed');
const RequestTooLarge     = mmError(4220, 'Request entity too large');
const RequestDecode       = mmError(4230, 'Request decode error');
const ResponseEncode      = mmError(4240, 'Response encode error');
const UnsupportedMedia    = mmError(4250, 'Unsupported media');
const MethodNotFound      = mmError(4400, 'Method not found');

const Duplicate           = mmError(4500, 'Duplicate entity');
const NotFound            = mmError(4540, 'Not found');

module.exports = {
  Error: mmError,
  Call,
  Unauthorized,
  TokenExpired,
  RequestValidation,
  ResponseValidation,
  RequestTooLarge,
  RequestDecode,
  ResponseEncode,
  UnsupportedMedia,
  MethodNotFound,

  Duplicate,
  NotFound
};

