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
    prefix: null, // example: '/someprefix'

    api: {
      versions: [ 1 ],
      '1': {
        limit: 100 * 1024,
        encoding: 'utf8'
      }
    },

    auth: {
      user: {
        token: {
          key: 'lalalamysupersecretkey',
          algorithm: 'HS256',
          expiresIn: '30 days',
          subject: 'user'
          // issuer: 'https://myapp.com', //token recipient put your app url here
        },

        hash: {
          N: 15, r: 8, p: 1 //check scrypt docs
        }
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
    },

    logger: {
      default: {
        name: 'app',
        streams: [
          {
            path: 'var/log/app.log'
          }
        ]
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
    }/*,

    static: {
      url: '/static',                        //static url
      root: this.core.root + '/static',      //root directory from which the static assets are to be served
      dotfiles: 'ignore',                    //option for serving dotfiles. Possible values are “allow”, “deny”, and “ignore”
      etag: true,                            //enable or disable etag generation
      extensions: false,                     //sets file extension fallbacks.
      index: 'index.html',                   //sends directory index file. Set false to disable directory indexing.
      lastModified: true,                    //set the Last-Modified header to the last modified date of the file on the OS.
      maxAge: 0,                             //set the max-age property of the Cache-Control header in milliseconds or a string in ms format
      redirect: true,                        //redirect to trailing “/” when the pathname is a directory.
      setHeaders: undefined                  //function for setting HTTP headers to serve with the file.
    },
*/

  };
};


module.exports = Settings;
