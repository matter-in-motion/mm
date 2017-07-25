'use strict';
const errors = require('../errors');
const Provider = require('./provider');

const Auth = function() {
  this.providers = {};
};

Auth.prototype.__initRequired = true;

Auth.prototype.__init = function(units) {
  const providers = units.require('core.settings').core.auth;
  for (let provider in providers) {
    let p = units.get(`resources.${provider}.provider`);
    this.providers[provider] = p || new Provider(providers[provider]);
  }
};

Auth.prototype.provider = function(name) {
  return this.providers[name];
};

Auth.prototype.verify = function(opts = {}, meta, cb) {
  const provider = this.providers[opts.provider];
  if (!provider || !provider.active) {
    return cb(errors.ProviderNotFound());
  }

  provider.verify(meta, opts, cb);
};

module.exports = Auth;
