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
  if (!settings.core.debug && settings.core.uncaught) {
    this.loadCore('uncaught');
  }

  this.addExtensions(settings.extensions);
  // this.loadCore('codecs');
  this.loadCore('transport');
  this.addResources();
  this.addCommands();
};

App.prototype.start = function() {
  this.ensureInited();
  this.loadCore('validator');
  this.loadCore('auth');
  this.loadCore('api');
  this.startTransports();
  this.didStart();
  this.reportStartupTime('Worker');
  return this;
};

App.prototype.startTransports = function() {
  const transport = this.units.require('core.transport');
  if (transport.http) {
    this.root = transport.http.root;
  }
  transport.start();
};

App.prototype.addResources = function() {
  const units = this.loader.tryRequire(path.join(process.cwd(), 'lib', 'resources', 'units'));
  units && this.units.add('resources', units);
};

App.prototype.addCommands = function() {
  const cmds = this.loader.tryRequire(path.join(process.cwd(), 'lib', 'commands'));
  cmds && this.units.add('commands', cmds);
};

App.prototype.addExtensions = function(extensions = [], pre = 'mm-') {
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
