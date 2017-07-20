'use strict';
const inherits = require('util').inherits;
const AppBase = require('./app_base');

const DaemonMaster = function(opts) {
  AppBase.call(this, opts);
};
inherits(DaemonMaster, AppBase);

DaemonMaster.prototype.start = function() {
  this
    .ensureInited()
    .units.require('core.daemon')
      .start();
  this.didStart();
  this.reportStartupTime('Deamon');
};

DaemonMaster.prototype.stop = function() {
  this
    .ensureInited()
    .units.require('core.daemon')
      .stop();
};

DaemonMaster.prototype.restart = function() {
  this
    .ensureInited()
    .units.require('core.daemon')
      .restart();
};


module.exports = DaemonMaster;
