'use strict';
const bunyan = require('bunyan');

let Logger = function() {
  this.loggers = {};
}

Logger.prototype.unitIsInitRequired = true;

Logger.prototype.unitInit = function(units) {
  this.settings = units.require('core.settings').core.logger;
  this.logger = bunyan.createLogger(this.settings.default);
};

Logger.prototype.get = function(name) {
  if (name === undefined || name === 'default') {
    return this.logger;
  }

  if (!this.loggers[name]) {
    let options = this.settings[name];
    this.loggers[name] = this.logger.child(options);
  }

  return this.loggers[name];
};

module.exports = Logger;
