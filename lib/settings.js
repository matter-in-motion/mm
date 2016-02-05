'use strict';
const path = require('path');
const inherits = require('util').inherits;
const SettingsBase = require('./settings_base');

let Settings = function() {
  SettingsBase.call(this);
  this.core = undefined;
};
inherits(Settings, SettingsBase);

Settings.prototype.init = function() {
  // default values for all settings understood by apis
  this.core = {
    root: path.join(process.cwd()),

    debug: false,

    uncaught: true,

    daemon: {
      start: {
        exec: require.main.filename,
        args: [ 'daemon' ],
        stdout: 'var/log/app.log',
        stderr: 'var/log/err.log'
      },
      pidFile: 'var/run/app.pid',
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

    prefix: null, // example: '/someprefix'

    api: {
      versions: [ 1 ],
      '1': {
        limit: 100 * 1024,
        encoding: 'utf8'
      }
    },

    http: {
      port: 3000,
      address: 'localhost',
      limit: null // bytes, null for no limit
      // tls: {},
    },

    websockets: {
      //
    },

    auth: {
      user: {
        key: 'lalalamysupersecretkey',
        algorithm: 'HS256',
        expiresIn: '30 days'
        //issuer: 'https://myapp.com', //token recipient put your app url here
      }
    },

    logger: {
      default: {
        name: 'app',
        stream: process.stdout
      },

      websockets: {
        unit: 'websockets'
      },

      cluster: {
        unit: 'cluster'
      },

      api: {
        unit: 'api'
      },

      uncaught: {
        unit: 'uncaught'
      }
    },

    validator: { //if you dont need this make it false
      allErrors: false,
      removeAdditional: true,
      useDefaults: true,
      coerceTypes: false,
      verbose: false,
      format: 'fast',
      meta: true,
      validateSchema: true,
      addUsedSchema: true,
      inlineRefs: true,
      loopRequired: Infinity,
      multipleOfPrecision: false,
      missingRefs: true,
      loadSchema: undefined, // function(uri, cb) { /* ... */ cb(err, schema); },
      uniqueItems: true,
      unicode: true,
      beautify: false,
      // cache: new Cache,
      errorDataPath: 'object',
      jsonPointers: false,
      messages: true,
      v5: true
    }
  };
};


module.exports = Settings;
