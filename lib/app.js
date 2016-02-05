'use strict';
const path = require('path');
const st = require('express').static;
const inherits = require('util').inherits;
const AppBase = require('./app_base');
const UnitSet = require('units').UnitSet;

let App = function(opts) {
  AppBase.call(this, opts);
};
inherits(App, AppBase);

App.prototype.addUnits = function() {};

App.prototype.start = function() {
  this.ensureInited();
  const settings = this.units.require('core.settings').core;
  settings.auth && this.addAuth();
  settings.validator && this.addValidator();
  settings.websockets && this.addSockets();
  settings.uncaught && this.addUncaught(settings.uncaught);

  this
    .httpStart(settings)
    .reportStartupTime('Worker');
};

App.prototype.addValidator = function() {
  this.units.require('core.validator');
  return this;
};

App.prototype.addUncaught = function() {
  this.units.require('core.uncaught');
  return this;
};

App.prototype.addSockets = function() {
  this.units.require('core.transport.ws');
  return this;
};

App.prototype.addAuth = function() {
  this.units.require('core.auth');
  return this;
};

App.prototype.addApi = function(add) {
  add && this.use('/api', this.units.require('core.api'));
  return this;
};

App.prototype.addRoot = function() {
  let contract = this.units.get('core.contract');
  contract && this.use(contract);
  return this;
};

App.prototype.addStatic = function(opts) {
  opts && this.use(opts.url, st(opts.root, opts));
  return this;
};

App.prototype.addResources = function() {
  let unitSet = this.loader.tryRequire(path.join(process.cwd(), 'lib', 'resources', 'units'));

  if (unitSet) {
    this.units.add({ resources: unitSet });
  } else {
    this.units.add('resources', new UnitSet());
  }

  return unitSet;
};

App.prototype.httpStart = function(settings) {
  let http = this.units.require('core.transport.http').start();
  this.root = http.express;
  return this
    .addRoot()
    .addApi(settings.api)
    .addStatic(settings.static);
};

App.prototype.use = function(path, contract) {
  if (!contract) {
    contract = path;
    path = '/';
  }

  if (contract.handle) {
    this.root.use(path, (req, res, next) => {
      contract.handle(req, res, next)
    });
  } else {
    this.root.use(path, contract);
  }
  return this;
};

App.prototype.console = function() {
  this.ensureInited();
  global.app = this;
  let repl = require('repl');
  let r = repl.start({ useGlobal: true });
  r.on('exit', function() {
    process.exit();
  });
};

App.prototype.call = function(f) {
  this.ensureInited();
  f.call(this);
};


module.exports = App;
