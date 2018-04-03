'use strict';
const Units = require('units');

const AppBase = function(opts) {
  this.startTime = Date.now();
  this.options = opts || {};
  this.loader = opts.loader;
  this.inited = false;
  this.createUnits();
  this.loadCore('settings');
};

AppBase.prototype.willInit = function() {};
AppBase.prototype.init = function() {
  this.loadCore('logger');
  this.logger = this.units.require('core.logger').logger;
  this.willInit();
  this.willStart();
  this.units.init();
  this.inited = true;
  this.didInit();
};
AppBase.prototype.didInit = function() {};

AppBase.prototype.willStart = function() {};
AppBase.prototype.start = function() {
  this.ensureInited();
  this.didStart();
};
AppBase.prototype.didStart = function() {};

AppBase.prototype.willStop = function() {};
AppBase.prototype.stop = function() {
  this.willStop()
  process.exit();
};

AppBase.prototype.createUnits = function() {
  this.units = new Units();
  const unit = new Units();
  this.units.add({ core: { app: unit.expose(this) } });
};

AppBase.prototype.loadCore = function(name, opts = {}) {
  if (opts.ifPresent) {
    const units = this.units;
    const dependencies = Array.isArray(opts.ifPresent) ? opts.ifPresent : [ opts.ifPresent ];
    let isPresent = true;

    for (let i in dependencies) {
      if (!units.has(dependencies[i])) {
        isPresent = false;
        break;
      }
    }

    if (!isPresent) {
      return;
    }
  }

  const unit = this.loader.loadUnit(name);
  this.units.add({ core: { [name]: unit } });
  return this;
};

AppBase.prototype.ensureInited = function() {
  if (!this.inited) {
    this.init();
  }
  return this;
};

AppBase.prototype.printUnits = function() {
  this.units.forEach((unit, name) => console.log(name));
};

AppBase.prototype.reportStartupTime = function(name) {
  this.logger.info({
    module: name,
    startup: Date.now() - this.startTime
  }, `${name} startup time: ${Date.now() - this.startTime} ms`)
};

module.exports = AppBase;
