'use strict';

var UncaughtExceptionHandler = function() {
  this.logger = null;
};

UncaughtExceptionHandler.prototype.unitInit = function(units) {
  this.logger = units.require('core.logger').get('uncaught');

  const self = this;
  process.on('uncaughtException', function(err) {
    self.handle(err);
  });
};

UncaughtExceptionHandler.prototype.handle = function(err) {
  if (this.logger) {
    this.logger.fatal(err);
  }
};


module.exports = UncaughtExceptionHandler;
