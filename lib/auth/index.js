'use strict';
const Promise = require('bluebird');
const errors = require('../errors');
const Provider = require('./provider');

const Auth = function() {
  this.providers = {};
};

Auth.prototype.__initRequired = true;

Auth.prototype.__init = function(units) {
  const providers = units.require('core.settings').auth;
  let defaultProvider;
  for (const provider in providers) {
    if (provider === 'default') {
      defaultProvider = providers[provider];
      continue;
    }

    const p = units.get(`resources.${provider}.provider`);
    this.providers[provider] = p || new Provider(providers[provider]);
  }

  this.default = this.providers[defaultProvider];
};

Auth.prototype.provider = function(name) {
  return this.providers[name];
};

Auth.prototype.verify = function(opts, token) {
  const provider = this.providers[opts.provider] || this.default;
  if (!provider || !provider.active) {
    return Promise.reject(errors.ProviderNotFound());
  }

  return provider.verify(token, opts);
};

module.exports = Auth;
