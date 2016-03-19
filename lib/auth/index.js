'use strict';
const errors = require('../protocol/errors');
const Provider = require('./provider');

let Auth = function() {
  this.providers = {};
};

Auth.prototype.unitIsInitRequired = true;

Auth.prototype.unitInit = function(units) {
  let providers = units.require('core.settings').core.auth;

  for (let provider in providers) {
    let p = units.get(`resources.${provider}.provider`);
    this.providers[provider] = p || new Provider(providers[provider]);
  }
};

Auth.prototype.provider = function(name) {
  return this.providers[name];
};

Auth.prototype.verify = function(opts = {}, head, cb) {
  const provider = this.providers[opts.provider];
  if (!provider) {
    cb(errors.ProviderNotFound());
  } else {
    provider.verify(head, opts, cb);
  }
};

module.exports = Auth;
