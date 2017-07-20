'use strict';
const path = require('path');

const SettingsBase = function() {};

SettingsBase.prototype.unitIsInitRequired = true;

SettingsBase.prototype.unitInit = function(units) {
  this.prepare();
};

SettingsBase.prototype.prepare = function() {
  this.init();
  const env = process.env.NODE_ENV;
  env && this.applyEnvironment(env);
};

SettingsBase.prototype.applyEnvironment = function(env) {
  try {
    const envSettings = require( path.join( process.cwd(), 'lib', 'settings', env) );
    envSettings(this);
  } catch (e) {
    console.log(`Error loading '${env}' environment settings file`);
    throw e;
  }
};


module.exports = SettingsBase;
