'use strict';
const cookie = require('cookie');
const jwt = require('jsonwebtoken');

let Auth = function() {
  this.name = 'user';
};

Auth.prototype.unitIsInitRequired = true;

Auth.prototype.unitInit = function(units) {
  this.settings = units.require('core.settings').core.auth.user;
};

Auth.prototype.sign = function(data, opts, cb) {
  let s = this.settings;

  jwt.sign(data, s.key, {
    algorithm: s.algorithm,
    expiresIn: opts.expiresIn || s.expiresIn,
    subject: opts.subject,
    issuer: s.issuer,
    audience: opts.audience
  }, cb);
};

Auth.prototype.verify = function(token, opts, cb) {
  let s = this.settings;

  if (!cb) {
    cb = opts;
    opts = {};
  }

  jwt.verify(token, s.key, {
    algorithms: [ s.algorithm ],
    audience: opts.audience,
    issuer: s.issuer,
    subject: opts.subject
  }, cb);
};

Auth.prototype.createHash = function(string, cb) {
  cb(null, string);
};

Auth.prototype.verifyHash = function(string, hash, cb) {
  cb(null, string === hash);
};

Auth.prototype.getMiddleware = function(opt) {
  const self = this;
  return function(req, res, next) {
    if (!req.cookies) {
      let cookies = req.headers.cookie;
      req.cookies = cookies ? cookie.parse(cookies) : {};
    }

    self.verify(req.cookies.auth, function(err, auth) {
      if (err && opt === 'required') {
        return next(err);
      }
      req.body.auth = auth;
      next();
    });
  }
};

module.exports = Auth;
