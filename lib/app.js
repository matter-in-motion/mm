'use strict';
const path = require('path');
const inherits = require('util').inherits;
const AppBase = require('./app_base');

const App = function(opts) {
  AppBase.call(this, opts);
  this.modules = path.join(process.cwd(), 'node_modules');
};
inherits(App, AppBase);

App.prototype.willInit = function() {
  const settings = this.units.require('core.settings');
  !settings.core.debug && settings.core.uncaught && this.addUncaught(settings.core.uncaught);
  settings.core.auth && this.addAuth();
  settings.core.validator && this.addValidator();
  settings.extensions && this.addExtensions(settings.extensions);

  this.addTransports();
  this.addResources();

  settings.core.api && this.addApi();
};

App.prototype.start = function() {
  this.ensureInited();
  this.startTransports();
  this.didStart();
  this.reportStartupTime('Worker');
};

App.prototype.addTransports = function() {
  const transport = this.units.require('core.transport');

  if (transport.http) {
    this.root = transport.http.root;
  }
};

App.prototype.startTransports = function() {
  this.units.require('core.transport').start();
};

App.prototype.addValidator = function() {
  this.units.require('core.validator');
};

App.prototype.addUncaught = function() {
  this.units.require('core.uncaught');
};

App.prototype.addAuth = function() {
  this.units.require('core.auth');
};

App.prototype.addApi = function() {
  this.units.require('core.api');
};

App.prototype.addResources = function() {
  const unitSet = this.loader.tryRequire(path.join(process.cwd(), 'lib', 'resources', 'units'));
  unitSet && this.units.add('resources', unitSet);
};

App.prototype.addExtensions = function(extensions, pre = 'mm-') {
  extensions.forEach(name => {
    const extension = this.require(pre + name);
    this.units.add(extension);
  });
};

App.prototype.require = function(name) {
  return require(path.join(this.modules, name));
};

App.prototype.add = function(name, units) {
  if (typeof name === 'object') {
    for (var n in name) {
      this.add(n, name[n]);
    }
    return;
  }

  this.units.add(name, units);

  if (name === 'contract' && this.root) {
    this.use(units);
  }

  return this;
};

App.prototype.use = function(path, contract) {
  if (!this.root) {
    throw new Error('There is no http transport defined');
  }

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
  const repl = require('repl');
  const r = repl.start({ useGlobal: true });
  r.on('exit', function() {
    process.exit();
  });
};

App.prototype.call = function(f) {
  this.ensureInited();
  f.call(this);
};


module.exports = App;
