'use strict';

const UncaughtExceptionHandler = function() {
  this.logger = null;
};

UncaughtExceptionHandler.prototype.__init = function(units) {
  this.logger = units.require('core.logger').get('uncaught');
  process.on('uncaughtException', err => this.handle(err));
};

UncaughtExceptionHandler.prototype.handle = function(err) {
  if (this.logger) {
    this.logger.fatal(err);
  }
};


module.exports = UncaughtExceptionHandler;
