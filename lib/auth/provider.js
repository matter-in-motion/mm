'use strict';
const Promise = require('bluebird');
const cookie = require('cookie');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ms = require('ms');

const Provider = function(opts = {}) {
  this.tokenSettings = opts.token;
  this.hashSettings = opts.hash;
  this.active = opts.active;
};

Provider.prototype.sign = function(data, opts = {}) {
  const s = this.tokenSettings;
  const res = {
    expires: Date.now() + ms(opts.expiresIn || s.expiresIn)
  }

  res.token = jwt.sign(data, s.key, {
    algorithm: s.algorithm,
    expiresIn: opts.expiresIn || s.expiresIn,
    subject: opts.subject || s.subject,
    audience: opts.audience || s.audience,
    issuer: s.issuer
  });

  return Promise.resolve(res);
};

Provider.prototype.verify = function(token, opts = {}) {
  if (!token) {
    return Promise.reject(new Error('No token provided'));
  }

  const s = this.tokenSettings;
  try {
    const data = jwt.verify(token, s.key, {
      algorithms: [ s.algorithm ],
      subject: opts.subject || s.subject,
      audience: opts.audience || s.audience,
      issuer: s.issuer
    });

    return Promise.resolve(data);
  } catch (e) {
    return Promise.reject(e);
  }
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

    this
      .verify(req.cookies.meta)
      .then(auth => {
        req.body.meta = auth;
        next();
      })
      .catch(err => {
        if (opt.auth === 'required') {
          return next(err);
        }
        next();
      });
  }
};

module.exports = Provider;
