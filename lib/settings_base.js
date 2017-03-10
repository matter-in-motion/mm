'use strict';
const path = require('path');

let SettingsBase = function() {};

SettingsBase.prototype.unitIsInitRequired = true;

SettingsBase.prototype.unitInit = function(units) {
  this.prepare();
};

SettingsBase.prototype.prepare = function() {
  this.init();
  let env = process.env.MM_ENV;
  env && this.applyEnvironment(env);
};

SettingsBase.prototype.applyEnvironment = function(env) {
  try {
    let envSettings = require( path.join( process.cwd(), 'lib', 'settings', env) );
    envSettings(this);
  } catch (e) {
    console.log(`Error loading '${env}' environment settings file`);
    throw e;
  }
};


module.exports = SettingsBase;
