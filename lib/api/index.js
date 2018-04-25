'use strict';
const Promise = require('bluebird');
const errors = require('../errors');

const randomDelay = function(minmax) {
  return minmax[0] + Math.random() * (minmax[1] - minmax[0]);
};

const Api = function() {
  this.serializers = {};
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
  this.discovery = settings.api.discovery;
  this.send = settings.api.throttle ?
    this.throttledSend(settings.throttleResponse) :
    this.simpleSend;

  units.require('serializers').forEach(unit => this.addSerializer(unit));

  this.transport
    .on('message', msg => this.onMessage(msg))
    .on('error', (msg, err) => this.onTransportError(msg, err));
};

Api.prototype.addSerializer = function(serializer) {
  this.serializers[serializer.mime] = serializer;
  return this;
};

Api.prototype.addResource = function(app, ns, api, ctrl) {
  const options = this.schemas[ns] = {};

  Object.keys(api).forEach(method => {
    let schema;
    try {
      schema = api[method].call(ctrl, app);
    } catch (e) {
      console.log(`${ns}.${method} schema error`);
      throw e;
    }

    options[method] = schema;
    const name = `${ns}.${method}`;
    const rpc = this.rpc[name] = {
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

  msg = this.decode(msg);
  if (msg.error) {
    return this.onError(msg);
  }

  if (msg.call.substr(-1) === '?') {
    if (!this.discovery) {
      return this.onError(msg, errors.Forbidden(undefined, 'Discovery requests are forbidden'))
    }

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
  const c = this.rpc[msg.call];
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
    return this._callResource(c.ctx, c.method, auth, msg)
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
  const res = this.encode(msg, response);
  this.transport.response(res);
};

Api.prototype.encode = function(msg, data) {
  const response = this.getResponse(msg, data);
  const serializer = this.serializers[msg.mime];

  try {
    msg.response = serializer.encode(response);
  } catch (e) {
    const err = this.getResponse(msg, { call: errors.ResponseEncode(e) });
    msg.response = serializer.encode(err);
  }

  return msg;
};

//a bit ugly but fast
Api.prototype.getResponse = function(msg, data) {
  let response = [ data.call || '' ];

  if (!(data.body === undefined || data.body === null)) {
    response[1] = data.body;
  }

  if (data.meta) {
    response[2] = data.meta;
    if (!response[1]) {
      response[1] = '';
    }
  }

  if (!(msg.id === undefined || msg.id === null)) {
    response[3] = msg.id;
    if (!response[1]) {
      response[1] = '';
    }

    if (!response[2]) {
      response[2] = '';
    }
  }

  return response;
};

Api.prototype.decode = function(msg) {
  const isPacked = !!msg.body;
  let body = (msg.body !== undefined ? msg.body : msg.request) || null;

  if (typeof body === 'string') {
    if (this.limit && body.length > this.limit) {
      msg.error = errors.RequestTooLarge();
      return msg;
    }

    const serializer = this.serializers[msg.mime];
    try {
      body = body ? serializer.decode(body) : null;
    } catch (e) {
      msg.error = errors.RequestDecode(undefined, e.toString());
      return msg;
    }
  }

  if (isPacked) {
    msg = Object.assign(msg, {
      call: body[0],
      request: body[1],
      meta: body[2] || msg.meta,
      id: body[3]
    });
  } else {
    msg.request = body;
  }

  return msg;
};

module.exports = Api;
