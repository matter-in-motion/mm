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

Auth.prototype.sign = function(data, opts = {}, cb) {
  let s = this.settings;

  return jwt.sign(data, s.key, {
    algorithm: s.algorithm,
    expiresIn: opts.expiresIn || s.expiresIn,
    subject: opts.subject,
    issuer: s.issuer,
    audience: opts.audience
  }, cb);
};

Auth.prototype.verify = function(token, opts = {}, cb) {
  if (!token) {
    if (cb) {
      return cb(new Error('No token provided'));
    } else {
      return false;
    }
  }

  let s = this.settings;
  return jwt.verify(token, s.key, {
    algorithms: [ s.algorithm ],
    audience: opts.audience,
    issuer: s.issuer,
    subject: opts.subject
  }, cb);
};

Auth.prototype.createHash = function(string) {
  return string;
};

Auth.prototype.verifyHash = function(string, hash) {
  return string === hash;
};

Auth.prototype.middleware = function(opt = {}) {
  const self = this;
  return function(req, res, next) {
    if (!req.cookies) {
      let cookies = req.headers.cookie;
      req.cookies = cookies ? cookie.parse(cookies) : {};
    }

    self.verify(req.cookies.auth, function(err, auth) {
      if (err && opt.auth === 'required') {
        return next(err);
      }
      req.body.auth = auth;
      next();
    });
  }
};

module.exports = Auth;
