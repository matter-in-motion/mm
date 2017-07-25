'use strict';
const bunyan = require('bunyan');

const Logger = function() {
  this.loggers = {};
}

Logger.prototype.__initRequired = true;

Logger.prototype.__init = function(units) {
  this.settings = units.require('core.settings').core.logger;
  this.logger = bunyan.createLogger(this.settings.default);
};

Logger.prototype.get = function(name, opts) {
  if (name === undefined || name === 'default') {
    return this.logger;
  }

  if (!this.loggers[name]) {
    const options = Object.assign({ unit: name }, opts, this.settings[name]);
    this.loggers[name] = this.logger.child(options);
  }

  return this.loggers[name];
};

module.exports = Logger;
