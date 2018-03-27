'use strict';
const inherits = require('util').inherits;
const AppBase = require('./appBase');

const DaemonMaster = function(opts) {
  AppBase.call(this, opts);
};
inherits(DaemonMaster, AppBase);

DaemonMaster.prototype.willInit = function() {
  this.loadCore('daemon');
};

DaemonMaster.prototype.start = function() {
  this.ensureInited();
  this.units.require('core.daemon').start();
  this.didStart();
  this.reportStartupTime('Deamon');
  return this;
};

DaemonMaster.prototype.stop = function() {
  this.ensureInited();
  this.units.require('core.daemon').stop();
};

DaemonMaster.prototype.restart = function() {
  this.ensureInited();
  this.units.require('core.daemon').restart();
};


module.exports = DaemonMaster;
