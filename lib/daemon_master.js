'use strict';
var inherits = require('util').inherits;
var AppBase = require('./app_base');

var DaemonMaster = function(opts) {
  AppBase.call(this, opts);
};
inherits(DaemonMaster, AppBase);

DaemonMaster.prototype.addUnits = function() {
};

DaemonMaster.prototype.start = function() {
  this
    .ensureInited()
    .units.require('core.daemon')
      .start();
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
