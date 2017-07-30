'use strict';
const path = require('path');
const cluster = require('cluster');
const minimist = require('minimist');

const TAB = '  ';

const Loader = function(opts) {
  this.args = minimist(process.argv.slice(2));
  this
    .setEnvironment(opts || {})
    .setDefaultCommands();
};

Loader.prototype.setEnvironment = function(opts) {
  const env = this.args.env || opts.env || process.env.NODE_ENV;
  if (env) {
    process.env.NODE_ENV = env;
  }

  return this;
};

Loader.prototype.setDefaultCommands = function() {
  this.add({
    run: {
      description: 'runs the app',
      call: () => this.getApp().start()
    },
    start: {
      description: 'starts the app in the daemon mode',
      call: () => this.getDaemonMaster().start()
    },
    stop: {
      description: 'stops the app in the daemon mode',
      call: () => this.getDaemonMaster().stop()
    },
    restart: {
      description: 'restarts the app in the daemon mode',
      call: () => this.getDaemonMaster().restart()
    },
    worker: {
      description: 'starts one instance of the app',
      call: () => this.getWorker().start()
    },
    console: {
      description: 'starts the REPL console with the loaded app',
      call: () => this.getWorker().console()
    }
  })
};

Loader.prototype.add = function(cmds) {
  this.commands = Object.assign(this.commands || {}, cmds);
  return this;
};

Loader.prototype._getHelp = function(pre, commands) {
  let help = '';
  for (let name in commands) {
    const cmd = commands[name];
    if (typeof cmd.call === 'function') {
      help += `${pre}\x1b[1m${name}\x1b[0m - ${cmd.description}\n`;
    } else {
      help += `${pre}\x1b[1m${name}\x1b[0m\n`;
      help += this._getHelp(pre + TAB, cmd);
    }
  }

  return help;
};

Loader.prototype.getHelp = function() {
  return this._getHelp(TAB, this.commands);
};

Loader.prototype.run = function(cmd = this.args._[0]) {
  let command = this.commands[cmd];
  if (command) {
    return command.call();
  }

  const app = this.getWorker().start();
  const commands = app.units.get('commands');
  if (commands) {
    commands.forEach( (cmd, name) => this.add({ [name]: cmd }) );
  }

  command = this.commands[cmd];
  if (!command) {
    return this.printHelpAndExit();
  }

  const log = require('./cli_log');
  let call;
  let args;
  if (typeof command.call === 'function') {
    call = command.call;
    args = this.args._.slice(1);
  } else {
    const name = this.args._[1]
    const c = command[name];

    if (!c) {
      return log.done(new Error(`${cmd} doesn't have a '${name}' command`));
    }

    call = c.call;
    args = this.args._.slice(2);
  }

  args.push(log.done);
  call.apply(app, args);
};

Loader.prototype.printHelpAndExit = function() {
  console.log(`Usage: ${path.basename(process.argv[1])} <command>`);
  console.log();
  console.log(this.getHelp());
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
