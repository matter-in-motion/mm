'use strict';
const path = require('path');
const inherits = require('util').inherits;
const AppBase = require('./appBase');

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

  this.loadExtensions(settings.extensions);
  this.tryLoad('serializers');
  this.tryLoad('resources');
  this.tryLoad('commands');
  this.loadCore('validator');
  this.loadCore('auth');
  this.loadCore('transport', { ifPresent: [ 'serializers', 'transports' ] });
  this.loadCore('api', { ifPresent: [ 'core.transport', 'resources' ] });
};

App.prototype.start = function() {
  this.ensureInited();
  this.startTransports();
  this.didStart();
  this.reportStartupTime('Worker');
  return this;
};

App.prototype.startTransports = function() {
  const transport = this.units.get('core.transport');
  if (!transport) {
    return;
  }

  transport.start();
};

App.prototype.tryLoad = function(name) {
  const units = this.loader.tryRequire(path.join(process.cwd(), this.loader.basePath, name));
  units && this.units.add(name, units);
};

App.prototype.loadExtensions = function(extensions = [], pre = 'mm-') {
  extensions.forEach(extension => {
    if (typeof extension === 'string') {
      extension = this.require(pre + extension);
    }

    const units = typeof extension === 'function' ?
      extension(this.units) : extension;

    units && this.units.add(units);
  });
};

App.prototype.require = function(name) {
  return require(path.join(this.modules, name));
};

App.prototype.add = function(name, units) {
  this.units.add(name, units);
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

App.prototype.loadCli = function() {
  let cli = this.units.get('core.cli');
  if (!cli) {
    this.loadCore('cli');
    cli = this.units.get('core.cli')
  }
  return cli;
};

App.prototype.run = function(...args) {
  this.loadCli();
  return this.loader._run(this, ...args)
};

App.prototype.call = function(f) {
  this.ensureInited();
  f.call(this);
};


module.exports = App;
