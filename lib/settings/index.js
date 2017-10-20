'use strict';
const inherits = require('util').inherits;
const SettingsBase = require('./settings');

const Settings = function() {
  SettingsBase.call(this);
};
inherits(Settings, SettingsBase);

Settings.prototype.init = function() {
  this.core = {
    debug: false,
    uncaught: true,

    api: '/api',

    codecs: {
      json: {
        type: 'application/json',
        limit: 100 * 1024, // bytes
        encoding: 'utf8'
      }
    },

    auth: {
      user: {
        active: true,
        token: {
          key: 'lalalamysupersecretkey',
          algorithm: 'HS256',
          expiresIn: '30 days',
          subject: 'user'
          // issuer: 'https://myapp.com', //token recipient put your app url here
        },

        hash: 10
      }
    },

    daemon: {
      start: {
        exec: require.main.filename,
        args: [ 'daemon' ],
        stdout: 'var/log/app.log',
        stderr: 'var/log/err.log'
      },
      pidFile: 'var/app/app.pid',
      exitCheckInterval: 200
    },

    cluster: {
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
      removeAdditional: true,
      useDefaults: true,
      errorDataPath: 'api'
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
