'use strict';
const UnitSet = require('units').UnitSet;

const AppBase = function(opts) {
  this.startTime = Date.now();
  this.options = opts || {};
  this.loader = opts.loader;
  this.isInited = false;
  this.units = null;
};

AppBase.prototype.init = function() {
  this.initInternal();
  this.isInited = true;
};

AppBase.prototype.initInternal = function() {
  this.prepareUnits();
};

AppBase.prototype.ensureInited = function() {
  if (!this.isInited) {
    this.init();
  }
  return this;
};

AppBase.prototype.prepareUnits = function() {
  this.units = this.createUnits();
  this.logger = this.units.require('core.logger').logger;
  this.willInit();
  this.willStart();
  this.initUnits();
};

AppBase.prototype.createUnits = function() {
  return new UnitSet(this); // using app as a loader
};

AppBase.prototype.addUnit = function(name) {
  const unit = this.loadUnit(name);
  if (!unit) {
    throw new Error('Could not load unit ' + name);
  }
  this.units.add(name, unit);
};

AppBase.prototype.loadUnit = function(name, local, init) {
  if (name === 'core.app') {
    return this;
  }

  if (this.loader) {
    return this.loader.loadUnit(name, local, init);
  }
};

AppBase.prototype.willInit = function() {};
AppBase.prototype.willStart = function() {};
AppBase.prototype.didStart = function() {};

AppBase.prototype.initUnits = function() {
  this.units.init();
};

AppBase.prototype.printUnits = function() {
  Object.keys(this.units.units).sort().forEach(name => console.log(name));
};

AppBase.prototype.start = function() {
  this.ensureInited();
  this.didStart();
};

AppBase.prototype.reportStartupTime = function(name) {
  this.logger.info({
    module: name,
    startup: Date.now() - this.startTime
  }, `${name} startup time: ${Date.now() - this.startTime} ms`)
};

module.exports = AppBase;
