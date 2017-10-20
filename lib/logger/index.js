'use strict';
const fs = require('fs');
const path = require('path');
const pino = require('pino');

const Logger = function() {
  this.loggers = {};
}

Logger.prototype.__initRequired = true;

Logger.prototype.__init = function(units) {
  const settings = units.require('core.settings').core.logger;
  let stream = settings.stream;

  if (typeof settings.stream === 'string') {
    stream = fs.createWriteStream(path.join(process.cwd(), settings.stream), { flags: 'w+' });
  }

  this.logger = pino(settings.options, stream);
};

Logger.prototype.get = function(name, opts) {
  if (name === undefined) {
    return this.logger;
  }

  if (!this.loggers[name]) {
    const options = Object.assign({ unit: name }, opts);
    this.loggers[name] = this.logger.child(options);
  }

  return this.loggers[name];
};

module.exports = Logger;
