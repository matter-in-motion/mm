'use strict';
const Provider = require('./provider');

let Auth = function() {
  this.providers = {};
};

Auth.prototype.unitIsInitRequired = true;

Auth.prototype.unitInit = function(units) {
  this.settings = units.require('core.settings').core.auth;
};

Auth.prototype.provider = function(name) {
  if (!this.providers[name]) {
    let opts = this.settings[name];
    this.providers[name] = new Provider(opts);
  }

  return this.providers[name];
};

Auth.prototype.verify = function(provider, token, cb) {
  return this.provider(provider).verify(token, undefined, cb);
};

module.exports = Auth;
