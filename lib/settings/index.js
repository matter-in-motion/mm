'use strict';
const inherits = require('util').inherits;
const SettingsBase = require('./settings');

const Settings = function() {
  SettingsBase.call(this);
};
inherits(Settings, SettingsBase);

Settings.prototype.init = function() {
  this.serializers = {};
  this.extensions = [];
  this.core = {
    debug: false,
    uncaught: true,

    api: {
      path: '/api',
      discovery: true,
      throttle: false
    },

    daemon: {
      start: {
        exec: require.main.filename,
        args: [ 'daemon' ],
        stdout: 'var/log/out.log',
        stderr: 'var/log/err.log'
      },
      pidFile: 'var/run/app.pid',
      exitCheckInterval: 200
    },

    cluster: {
      disabled: false,
      numberOfWorkers: null, // cpus().length
      master: {
        exec: require.main.filename,
        args: null,
        silent: null
      },
      checks: {
        lazy: {
          interval: 40 * 1000,
          maxTime: 30 * 1000
        },
        zombie: {
          interval: 40 * 1000,
          maxTime: 30 * 1000
        }
      }
    },

    //https://github.com/epoberezkin/ajv#options
    //if you dont need this make it false
    validator: {
      useDefaults: true,
      $data: true
    },

    logger: {
      options: { name: 'app' },
      stream: 'var/log/app.log'
    }
  };

  Object.defineProperty(this.core, 'root', {
    value: process.cwd(),
    writable: false
  });
};


module.exports = Settings;
