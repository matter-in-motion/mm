'use strict';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ms = require('ms');

const Provider = function(opts = {}) {
  this.tokenSettings = opts.token;
  this.hashSettings = opts.hash || 10;
  this.active = opts.active;
};

Provider.prototype.sign = function(data, opts = {}) {
  const s = this.tokenSettings;
  let res = {
    expires: Date.now() + ms(opts.expiresIn || s.expiresIn)
  }

  const signOpts = {
    algorithm: s.algorithm,
    subject: s.subject,
    issuer: s.issuer,
    expiresIn: opts.expiresIn || s.expiresIn
  };

  const audience = opts.audience || s.audience;
  if (audience) {
    signOpts.audience = audience;
  }

  const notBefore = opts.notBefore || s.notBefore;
  if (notBefore) {
    signOpts.notBefore = notBefore;
  }

  res.token = jwt.sign(data, s.key, signOpts);

  if (opts.mixin) {
    res = Object.assign({}, opts.mixin, res);
  }

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
  return bcrypt.compare(string, hash)
    .then(res => {
      if (!res) {
        throw new Error('Hash doesn\'t match a string');
      }
    })
};

module.exports = Provider;
