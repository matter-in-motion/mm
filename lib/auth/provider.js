'use strict';
const Promise = require('bluebird');
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

Provider.prototype.createHash = function(string) {
  return bcrypt.hash(string, this.hashSettings);
};

Provider.prototype.verifyHash = function(hash, string) {
  return bcrypt.compare(string, hash);
};


module.exports = Provider;
