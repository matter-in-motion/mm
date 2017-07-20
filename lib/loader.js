'use strict';
const path = require('path');
const cluster = require('cluster');
const minimist = require('minimist');

const Loader = function(opts) {
  this.args = minimist(process.argv.slice(2));
  this.commands = {};
  this
    .setEnvironment(opts || {})
    .setDefaultCommands();
};

Loader.prototype.setEnvironment = function(opts) {
  let env = this.args.env || opts.env;
  if (env) {
    process.env.NODE_ENV = env;
  }

  return this;
};

Loader.prototype.setDefaultCommands = function() {
  this
    .add('run', () => this.getApp().start())
    .add('start', () => this.getDaemonMaster().start())
    .add('stop', () => this.getDaemonMaster().stop())
    .add('restart', () => this.getDaemonMaster().restart())
    .add('daemon', () => this.getApp({ daemon: true }).start())
    .add('worker', () => this.getWorker().start())
    .add('console', () => this.getWorker().console());
};

Loader.prototype.add = function(ctx, cmd, cb) {
  if (typeof cmd === 'function') {
    this.commands[ctx] = cmd;
    return this;
  } else if (!this.commands[ctx]) {
    this.commands[ctx] = {};
  }

  this.commands[ctx][cmd] = cb || true;
  return this;
};

Loader.prototype.getSupportedCommands = function() {
  let cmds = this.commands;
  let res = [];
  for (let ctx in this.commands) {
    let cmd = cmds[ctx];

    if (typeof cmd === 'function') {
      res.push(ctx);
    } else {
      res.push(ctx + ' | ' + Object.keys(cmd).join(' '));
    }
  }

  return res;
};

Loader.prototype.run = function(cmd) {
  !this.runCmd(cmd) && this.printUsageAndExit();
};

Loader.prototype.runCmd = function(cmd) {
  let ctx = this.commands[cmd || this.args._[0]];

  if (ctx) {
    if (typeof ctx === 'function') {
      ctx();
      return true;
    } else if (typeof ctx[this.args._[1]] === 'function') {
      ctx[this.args._[1]].apply(this.getWorker(), this.args._.slice(2));
      return true;
    }
  }
};

Loader.prototype.printUsageAndExit = function() {
  console.log(`Usage: ${path.basename(process.argv[1])} <command>`);
  console.log();
  console.log('Supported commands:');
  console.log('\t' + this.getSupportedCommands().join('\n\t'));
  process.exit(1);
};

Loader.prototype.basePath = 'lib';
Loader.prototype.standardBasePath = __dirname;

Loader.prototype.appFiles = {
  loader: 'loader',
  app: 'app',
  clusterMaster: 'cluster_master',
  daemonMaster: 'daemon_master',
  console: 'console'
};

Loader.prototype.standardUnitPaths = {
  'core.daemon': 'daemon',
  'core.cluster': 'cluster',

  'core.settings': 'settings',
  'core.logger': 'logger',
  'core.uncaught': 'uncaught',

  'core.api': 'api',
  'core.auth': 'auth',
  'core.validator': 'validator',

  'core.transport': 'transport'
};

Loader.prototype.unitPaths = {
  'core.settings': 'settings'
};

Loader.prototype.getStandardUnitPath = function(name) {
  let result;
  let unitPath = this.standardUnitPaths[name];
  if (unitPath) {
    result = path.join(this.standardBasePath, unitPath);
  }
  return result;
};

Loader.prototype.getUnitPath = function(name) {
  let result;
  let unitPath = this.unitPaths[name];
  if (unitPath) {
    result = path.join(process.cwd(), this.basePath, unitPath);
  }
  return result;
};

Loader.prototype.resolveUnit = function(name) {
  let result = this.tryRequire(this.getUnitPath(name));
  if (!result) {
    let path = this.getStandardUnitPath(name);
    if (path) {
      result = require(path);
    }
  }
  return result;
};

Loader.prototype.loadUnit = function(name) {
  const Unit = this.resolveUnit(name);
  if (Unit) {
    return new Unit();
  }
};

Loader.prototype.getPath = function(name) {
  return path.join(process.cwd(), this.basePath, this.appFiles[name]);
};

Loader.prototype.getStandardPath = function(name) {
  return path.join(this.standardBasePath, this.appFiles[name]);
};

Loader.prototype.tryRequire = function(id) {
  let result;
  if (id) {
    try {
      result = require(id);
    } catch (err) {
      let skipErr = false;
      if (err.code === 'MODULE_NOT_FOUND') {
        try {
          // NOTE ensure we cannot require this particular id,
          // not some of it's dependencies
          require.resolve(id);
        } catch (resolveErr) {
          if (resolveErr.code === 'MODULE_NOT_FOUND') {
            skipErr = true;
          }
        }
      }
      if (!skipErr) {
        throw err;
      }
    }
  }
  return result;
};

Loader.prototype.resolve = function(name, skipStandard) {
  let result = this.tryRequire(this.getPath(name));
  if (!result && !skipStandard) {
    let path = this.getStandardPath(name);
    if (path) {
      result = require(path);
    }
  }
  return result;
};

Loader.prototype.load = function(name, opts, defaults) {
  let result = defaults;
  let AppClass = this.resolve(name, !!defaults);
  if (AppClass) {
    let options = opts || {};
    options.loader = this;
    result = new AppClass(options);
  }
  return result;
};

Loader.prototype.require = function(name, opts, defaults) {
  let result = this.load(name, opts, defaults);
  if (!result) {
    throw new Error('Could not load ' + name);
  }
  return result;
};

Loader.prototype.getLoader = function(opts) {
  return this.require('loader', opts, this);
};

Loader.prototype.getApp = function(opts) {
  let result;
  if (cluster.isMaster) {
    result = this.getClusterMaster(opts);
  }
  if (!result) {
    result = this.getWorker(opts);
  }
  return result;
};

Loader.prototype.getWorker = function(opts) {
  return this.require('app', opts);
};

Loader.prototype.getClusterMaster = function(opts) {
  return this.require('clusterMaster', opts);
};

Loader.prototype.getDaemonMaster = function(opts) {
  return this.require('daemonMaster', opts);
};

Loader.create = function(opts) {
  return new Loader(opts).getLoader(opts);
};

Loader.run = function(opts) {
  return Loader.create(opts).run();
};


module.exports = Loader;
