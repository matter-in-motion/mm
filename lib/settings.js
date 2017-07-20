'use strict';
const path = require('path');
const inherits = require('util').inherits;
const SettingsBase = require('./settings_base');

const Settings = function() {
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
    prefix: null, // example: '/someprefix'

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
    },

    logger: {
      default: {
        name: 'app',
        streams: [
          {
            path: 'var/log/app.log'
          }
        ]
      }
    }
  };
};


module.exports = Settings;
