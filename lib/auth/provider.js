'use strict';
const cookie = require('cookie');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ms = require('ms');

const Provider = function(opts = {}) {
  this.tokenSettings = opts.token;
  this.hashSettings = opts.hash;
  this.active = opts.active;
};

Provider.prototype.sign = function(data, opts = {}, cb) {
  const s = this.tokenSettings;
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

  cb(null, res);
};

Provider.prototype.verify = function(token, opts = {}, cb) {
  if (!token) {
    return cb(new Error('No token provided'));
  }

  const s = this.tokenSettings;

  jwt.verify(token, s.key, {
    algorithms: [ s.algorithm ],
    subject: opts.subject || s.subject,
    audience: opts.audience || s.audience,
    issuer: s.issuer
  }, cb);
};

Provider.prototype.createHash = function(string, cb) {
  bcrypt.hash(string, this.hashSettings, cb);
};

Provider.prototype.verifyHash = function(hash, string, cb) {
  bcrypt.compare(string, hash, cb);
};

// express-like middleware
Provider.prototype.middleware = function(opt = {}) {
  return (req, res, next) => {
    if (!req.cookies) {
      const cookies = req.headers.cookie;
      req.cookies = cookies ? cookie.parse(cookies) : {};
    }

    this.verify(req.cookies.auth, (err, auth) => {
      if (err && opt.auth === 'required') {
        return next(err);
      }
      req.body.head = auth;
      next();
    });
  }
};

module.exports = Provider;
