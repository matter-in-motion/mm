'use strict';
const path = require('path');
require('dotenv').config();

const Settings = function() {};

Settings.prototype.__initRequired = true;

Settings.prototype.__init = function() {
  this.init();
  const env = process.env.NODE_ENV;
  env && env !== 'production' && this.apply(env);
};

Settings.prototype.joinPath = function(...args) {
  return path.join.call(null, this.core.root, ...args);
};

Settings.prototype.require = function(name) {
  if (!this[name]) {
    throw new Error(`'${name}' settings is required`);
  }

  return this[name];
};

Settings.prototype.apply = function(settings) {
  if (typeof settings === 'string') {
    try {
      const env = require(this.joinPath('lib', 'settings', settings));
      env.call(this);
    } catch (e) {
      console.log(`Error loading '${settings}' environment settings file`);
      throw e;
    }
    return;
  }

  Object.assign(this, settings);
};


module.exports = Settings;
