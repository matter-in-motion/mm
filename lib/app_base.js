'use strict';
var UnitSet = require('units').UnitSet;

var AppBase = function(opts) {
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
  this.addUnits();
  this.initUnits();
};

AppBase.prototype.createUnits = function() {
  return new UnitSet(this); // using app as a loader
};

AppBase.prototype.addUnit = function(name) {
  var unit = this.loadUnit(name);
  if (!unit) {
    throw new Error('Could not load unit ' + name);
  }
  this.units.add(name, unit);
};

AppBase.prototype.loadUnit = function(name, local, init) {
  var result;
  if (name === 'core.app') {
    result = this;
  } else if (this.loader) {
    result = this.loader.loadUnit(name, local, init);
  }
  return result;
};

AppBase.prototype.addUnits = function() {
};

AppBase.prototype.initUnits = function() {
  this.units.init();
};

AppBase.prototype.start = function() {
  this.ensureInited();
};

AppBase.prototype.reportStartupTime = function(name) {
  this.logger.info({
    module: name,
    startup: Date.now() - this.startTime
  }, `${name} startup time: ${Date.now() - this.startTime} ms`)
};

module.exports = AppBase;
