'use strict';
const cookie = require('cookie');
const scrypt = require('scrypt');
const jwt = require('jsonwebtoken');
const ms = require('ms');

let Auth = function(opts) {
  this.tokenSettings = opts.token;
  this.hashSettings = opts.hash;
};

Auth.prototype.sign = function(data, opts = {}, cb) {
  let s = this.tokenSettings;
  let res = {
    expires: Date.now() + ms(opts.expiresIn || s.expiresIn)
  }

  res.token = jwt.sign(data, s.key, {
    algorithm: s.algorithm,
    expiresIn: opts.expiresIn || s.expiresIn,
    subject: opts.subject || s.subject,
    audience: opts.audience || s.audience,
    issuer: s.issuer
  });

  if (cb) {
    cb(res);
  } else {
    return res;
  }
};

Auth.prototype.verify = function(token, opts = {}, cb) {
  if (!token) {
    return cb ? cb(new Error('No token provided')) : false;
  }

  let s = this.tokenSettings;

  try {
    return jwt.verify(token, s.key, {
      algorithms: [ s.algorithm ],
      subject: opts.subject || s.subject,
      audience: opts.audience || s.audience,
      issuer: s.issuer
    }, cb);
  } catch (e) {
    return cb ? cb(e) : e;
  }
};

Auth.prototype.createHash = function(string) {
  return scrypt.kdf(string, this.hashSettings);
};

Auth.prototype.verifyHash = function(hash, string) {
  return scrypt.verifyKdf(hash, string);
};

Auth.prototype.middleware = function(opt = {}) {
  const self = this;
  return function(req, res, next) {
    if (!req.cookies) {
      let cookies = req.headers.cookie;
      req.cookies = cookies ? cookie.parse(cookies) : {};
    }

    self.verify(req.cookies.auth, (err, auth) => {
      if (err && opt.auth === 'required') {
        return next(err);
      }
      req.body.auth = auth;
      next();
    });
  }
};

module.exports = Auth;
