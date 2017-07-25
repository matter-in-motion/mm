'use strict';
const errors = require('../errors');

const randomDelay = function(minmax) {
  return minmax[0] + Math.random() * (minmax[1] - minmax[0]);
};

const Api = function() {
  this.codecs = {};
  this.schemas = {};
  this.rpc = {};
}

Api.prototype.__init = function(units) {
  this.transport = units.require('core.transport');
  this.validator = units.require('core.validator');
  this.logger = units.require('core.logger').get('api');
  this.auth = units.require('core.auth');

  units
    .get('resources')
    .match('^(.*)\.api$', (unit, name) => this.addResource(name, unit));

  const settings = units.require('core.settings').core;
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

Api.prototype.addResource = function(ns, api) {
  let options = this.schemas[ns] = {};

  api.calls && api.calls.forEach( method => {
    if (typeof api[method] !== 'function') {
      this.logger.warn({
        resource: ns,
        method
      }, `no method ${ns}.${method} in the api`);
      return;
    }

    let schema;
    try {
      schema = api[method]();
    } catch (e) {
      console.log(`${ns}.${method} schema error`);
      throw e;
    }

    options[method] = schema;
    let name = `${ns}.${method}`;
    let rpc = this.rpc[name] = {
      ctx: api,
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
    //strip the qusetion mark
    msg.call = msg.call.substr(0, msg.call.length - 1);
    return this.onDiscovery(msg);
  }

  this.onRequest(msg);
};

Api.prototype.onDiscovery = function(msg) {
  let call = msg.call;

  //return all resources
  if (!call) {
    return this.onSuccess(msg, Object.keys(this.schemas));
  }

  //return all methods
  if (this.schemas[call]) {
    return this.onSuccess(msg, Object.keys(this.schemas[call]));
  }

  //return schema
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

  if (msg.meta || c.auth.required ) {
    this.auth.verify(c.auth, msg.meta, (err, auth) => {
      if (err && c.auth.required === true) {
        this.onAuthError(msg);
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
    return c.method.call(c.ctx, msg.httpRequest || msg.connection, auth, msg.request, (err, result) => this.onCallResult(c, msg, err, result));
  }

  if (c.request && !c.request(msg.request)) {
    return this.onRequestValidationError(msg, c.request.errors);
  }

  c.method.call(c.ctx, auth, msg.request, (err, result) => this.onCallResult(c, msg, err, result));
};

Api.prototype.onCallResult = function(c, msg, err, result) {
  if (err) {
    return this.onError(msg, err.code ? err : errors.Call(null, err.message));
  }

  if (c.response && !c.response(result)) {
    return this.onResponseValidationError(msg, c.response.errors);
  }

  this.onSuccess(msg, result);
};

Api.prototype.onMethodNotFound = function(msg) {
  this.onError(msg, errors.MethodNotFound(msg.call));
};

Api.prototype.onAuthError = function(msg) {
  this.onError(msg, errors.Unauthorized());
};

Api.prototype.onRequestValidationError = function(msg, errs) {
  this.onError(msg, errors.RequestValidation(errs));
};

Api.prototype.onResponseValidationError = function(msg, errs) {
  this.onError(msg, errors.ResponseValidation(errs));
};

Api.prototype.onTransportError = function(msg, err) {
  // console.log(msg, err);
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
  msg = this.codecs[msg.type].encode(msg, response);
  this.transport.response(msg);
};

module.exports = Api;
