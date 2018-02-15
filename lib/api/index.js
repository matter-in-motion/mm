'use strict';
const Promise = require('bluebird');
const errors = require('../errors');

const randomDelay = function(minmax) {
  return minmax[0] + Math.random() * (minmax[1] - minmax[0]);
};

const Api = function() {
  this.codecs = {};
  this.schemas = {};
  this.rpc = {};
}

Api.prototype.__initRequired = true;

Api.prototype.__init = function(units) {
  this.transport = units.require('transport');
  this.validator = units.require('validator');
  this.auth = units.require('auth');

  const app = units.require('app');
  units
    .require('resources')
    .match('^(.*).api$', (unit, name) => this.addResource(
      app,
      name,
      unit,
      units.get(`resources.${name}.controller`)
    ));

  const settings = units.require('settings').core;
  this.debug = settings.debug;
  this.send = settings.throttleResponse ?
    this.throttledSend(settings.throttleResponse) :
    this.simpleSend;

  this.addCodecs(settings.codecs);
  this.transport
    .on('message', msg => this.onMessage(msg))
    .on('error', (msg, err) => this.onTransportError(msg, err));
};

Api.prototype.addCodecs = function(codecs) {
  for (let name in codecs) {
    const opts = codecs[name];
    const Codec = require('../codecs/' + name);
    this.codecs[opts.type] = new Codec(opts);
  }

  return this;
};

Api.prototype.addResource = function(app, ns, api, ctrl) {
  let options = this.schemas[ns] = {};

  Object.keys(api).forEach(method => {
    let schema;
    try {
      schema = api[method].call(ctrl, app);
    } catch (e) {
      console.log(`${ns}.${method} schema error`);
      throw e;
    }

    options[method] = schema;
    let name = `${ns}.${method}`;
    let rpc = this.rpc[name] = {
      ctx: app,
      method: schema.call,
      auth: schema.auth || {},
      raw: schema.raw
    }

    if (schema.request) {
      rpc.request = this.validator.addSchema(name + ':request', schema.request);
    }

    if (this.debug && schema.response) {
      rpc.response = this.validator.addSchema(name + ':response', schema.response);
    }
  });

  return this;
};

Api.prototype.onMessage = function(msg) {
  if (msg.raw) {
    return this.onRequest(msg);
  }

  msg = this.codecs[msg.type].decode(msg);
  if (msg.error) {
    return this.onError(msg);
  }

  if (msg.call.substr(-1) === '?') {
    // Strip the qusetion mark
    msg.call = msg.call.substr(0, msg.call.length - 1);
    return this.onDiscovery(msg);
  }

  this.onRequest(msg);
};

Api.prototype.onDiscovery = function(msg) {
  let call = msg.call;

  // Return all resources
  if (!call) {
    return this.onSuccess(msg, Object.keys(this.schemas));
  }

  // Return all methods
  if (this.schemas[call]) {
    return this.onSuccess(msg, Object.keys(this.schemas[call]));
  }

  // Return schema
  call = call.split('.');
  const method = call.pop();
  call = call.join('.');
  const schema = this.schemas[call][method];
  const res = {
    auth: schema.auth || false,
    request: schema.request,
    response: schema.response
  }

  if (schema.title) {
    res.title = schema.title;
  }

  if (schema.description) {
    res.description = schema.description;
  }

  return this.onSuccess(msg, res);
};

Api.prototype.onRequest = function(msg) {
  let c = this.rpc[msg.call];
  if (!c) {
    return this.onMethodNotFound(msg);
  }

  if (msg.meta || c.auth.required) {
    this.auth
      .verify(c.auth, msg.meta)
      .asCallback((err, auth) => {
        if (err && c.auth.required === true) {
          this.onAuthError(msg, err);
        } else {
          this.callResource(c, auth, msg);
        }
      });
  } else {
    this.callResource(c, null, msg);
  }
};

Api.prototype.callResource = function(c, auth, msg) {
  if (c.raw || msg.raw) {
    return this._callResource(c.ctx, c.method, msg.httpRequest || msg.connection, auth, msg.request)
      .then(result => this.onCallResult(c, msg, result))
      .catch(err => this.onError(msg, err.code ? err : errors.Call(null, err.message)));
  }

  if (c.request && !c.request(msg.request)) {
    return this.onRequestValidationError(msg, c.request.errors);
  }

  this._callResource(c.ctx, c.method, auth, msg.request)
    .then(result => this.onCallResult(c, msg, result))
    .catch(err => this.onError(msg, err.code ? err : errors.Call(null, err.message)));
};

Api.prototype._callResource = function(ctx, method, ...args) {
  return new Promise((resolve, reject) => {
    try {
      resolve(method.apply(ctx, args));
    } catch (e) {
      reject(e);
    }
  });
};

Api.prototype.onCallResult = function(c, msg, result) {
  if (c.response && !c.response(result)) {
    return this.onResponseValidationError(msg, c.response.errors);
  }

  this.onSuccess(msg, result);
};

Api.prototype.onMethodNotFound = function(msg) {
  this.onError(msg, errors.MethodNotFound(msg.call));
};

Api.prototype.onAuthError = function(msg, err) {
  this.onError(msg, err.code ? err : errors.Unauthorized(err));
};

Api.prototype.onRequestValidationError = function(msg, errs) {
  this.onError(msg, errors.RequestValidation(errs));
};

Api.prototype.onResponseValidationError = function(msg, errs) {
  this.onError(msg, errors.ResponseValidation(errs));
};

Api.prototype.onTransportError = function(msg, err) {
  this.onError(msg, err);
};

Api.prototype.onError = function(msg, err) {
  this.send(msg, { call: err || msg.error });
};

Api.prototype.onSuccess = function(msg, res) {
  this.send(msg, { body: res });
};

Api.prototype.throttledSend = function(delays) {
  return (msg, res) => setTimeout(() => this._send(msg, res), randomDelay(delays));
};

Api.prototype.simpleSend = function(msg, res) {
  this._send(msg, res);
};

Api.prototype._send = function(msg, response) {
  const res = this.codecs[msg.type].encode(msg, response);
  this.transport.response(res);
};

module.exports = Api;
