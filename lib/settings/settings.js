'use strict';
const path = require('path');
const SettingsBase = function() {};

SettingsBase.prototype.__initRequired = true;

SettingsBase.prototype.__init = function() {
  this.init();
  const env = process.env.NODE_ENV;
  env && env !== 'production' && this.applyEnvironment(env);
};

SettingsBase.prototype.joinPath = function(...args) {
  return path.join.call(null, this.core.root, ...args);
};

SettingsBase.prototype.applyEnvironment = function(env) {
  try {
    const settings = require(this.joinPath('lib', 'settings', env));
    settings.call(this);
  } catch (e) {
    console.log(`Error loading '${env}' environment settings file`);
    throw e;
  }
};


module.exports = SettingsBase;
