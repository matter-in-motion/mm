'use strict';
const path = require('path');
const cluster = require('cluster');
const minimist = require('minimist');
const Promise = require('bluebird');

const TAB = '  ';

const Loader = function(opts) {
  this.args = minimist(process.argv.slice(2));
  this
    .setEnvironment(opts || {})
    .setDefaultCommands();
};

Loader.prototype.basePath = 'lib';
Loader.prototype.standardPath = __dirname;

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
    daemon: {
      description: 'starts the daemon',
      call: () => this.getApp({ daemon: true }).start()
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

Loader.prototype.getCommand = function(app, cmd) {
  if (!this.commandsAdded) {
    const commands = app.units.get('commands');
    if (commands) {
      commands.forEach((cmd, name) => this.add({ [name]: cmd }));
    }

    this.commandsAdded = true;
  }

  return this.commands[cmd];
};

Loader.prototype.add = function(cmds) {
  this.commands = Object.assign(this.commands || {}, cmds);
  return this;
};

Loader.prototype.getHelp = function() {
  return this._getHelp(TAB, this.commands);
};

Loader.prototype._getHelp = function(pre, commands) {
  let help = '';
  for (let name in commands) {
    const cmd = commands[name];
    if (typeof cmd.call === 'function') {
      help += `${pre}\x1b[1m${name}\x1b[0m - ${cmd.description}\n`;
    } else {
      help += `\n${pre}\x1b[1m${name}\x1b[0m\n`;
      help += this._getHelp(pre + TAB, cmd);
    }
  }

  return help;
};

Loader.prototype.run = function(...args) {
  if (!args.length) {
    args = this.args._;
  }

  const command = this.commands[args[0]];
  if (command) {
    return command.call.apply(null, args.slice(1));
  }

  const app = this.getWorker().start();
  const cli = app.loadCli();
  return this._run(app, ...args)
    .then(cli.done)
    .catch(e => {
      if (!e) {
        this.printHelpAndExit();
      }

      cli.error(e);
      if (e.code < 0) {
        this.printHelpAndExit();
      }
    })
    .then(cli.exit);
};

Loader.prototype._run = function(app, cmd, ...args) {
  const command = this.getCommand(app, cmd);
  if (!command) {
    if (!cmd) {
      return Promise.reject();
    }

    const err = new Error('command not found');
    err.code = -1;
    return Promise.reject(err);
  }

  let call;
  if (typeof command.call === 'function') {
    call = command.call;
  } else {
    const name = args.shift();
    const c = command[name];

    if (!c) {
      const err = new Error(`${cmd} doesn't have a '${name}' command`);
      err.code = -2;
      return Promise.reject(err);
    }

    call = c.call;
  }

  return new Promise((resolve, reject) => {
    try {
      resolve(call.apply(app, args));
    } catch (e) {
      reject(e);
    }
  });
};

Loader.prototype.printHelpAndExit = function() {
  console.log(`Usage: ${path.basename(process.argv[1])} <command>`);
  console.log();
  console.log(this.getHelp());
  process.exit(1);
};

Loader.prototype.getStandardPath = function(name) {
  return path.join(this.standardPath, name);
};

Loader.prototype.getAppPath = function(name) {
  return path.join(process.cwd(), this.basePath, name);
};

Loader.prototype.getUnit = function(name) {
  const unit = this.tryRequire(this.getAppPath(name));
  if (unit) {
    return unit;
  }

  return require(this.getStandardPath(name));
};

Loader.prototype.loadUnit = function(name) {
  const Unit = this.getUnit(name);
  if (Unit.__expose || Unit.__extend) {
    return Unit;
  }

  return new Unit();
};

Loader.prototype.resolve = function(name, skipStandard) {
  let result = this.tryRequire(this.getAppPath(name));
  if (!result && !skipStandard) {
    const path = this.getStandardPath(name);
    if (path) {
      result = require(path);
    }
  }
  return result;
};

Loader.prototype.load = function(name, opts, defaults) {
  const AppClass = this.resolve(name, !!defaults);
  if (AppClass) {
    const options = opts || {};
    options.loader = this;
    return new AppClass(options);
  }
  return defaults;
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

Loader.prototype.tryRequire = function(name) {
  let result;
  if (name) {
    try {
      result = require(name);
    } catch (err) {
      let skipErr = false;
      if (err.code === 'MODULE_NOT_FOUND') {
        try {
          // NOTE ensure we cannot require this particular id, not some of it's dependencies
          require.resolve(name);
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


Loader.create = function(opts) {
  return new Loader(opts).getLoader(opts);
};

Loader.run = function(opts) {
  return Loader.create(opts).run();
};


module.exports = Loader;
