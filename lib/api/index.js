'use strict';
const inherits = require('util').inherits;
const Contract = require('../contract');
const errors = require('../protocol/errors');

const rxVersion = /^\/api\/(\d+)$/;

let Api = function(opts) {
  Contract.call(this, opts);
  this.protocols = {};
  this.rpc = {};
}
inherits(Api, Contract);

Api.prototype.unitInit = function(units) {
  this.validator = units.require('core.validator');
  this.logger = units.require('core.logger').get('api');
  this.auth = units.require('core.auth');

  let resources = units.require('resources');
  let apiRx = /^(.*)\.api$/;

  Object.keys(resources.unitInfoDict).forEach(key => {
    let ns = key.match(apiRx);
    if (ns) {
      this.addResource(
        ns[1],
        resources.get(key)
      );
    }
  });

  const settings = units.require('core.settings').core;
  this.debug = settings.debug;

  if (settings.websockets) {
    let ws = units.require('core.transport.ws');
    this.addWSTransport(ws);
  }

  this
    .addProtocols(settings.api)
    .addHttpTransport();
};

Api.prototype.addProtocols = function(opts) {
  const self = this;
  let versions = opts.versions || [ 1 ];
  versions.forEach(function(version) {
    let protocol = require('../protocol/' + version);
    self.protocols[version] = protocol;
    self.use('/' + version, protocol.http.request(opts[version]));

    if (self.ws) {
      protocol.ws.request = protocol.ws.request(opts[version]);
    }
  });

  this.param('version', function(req, res, next, version) {
    req.mmpVersion = version;
    res.mmpVersion = version;
    res.mmpTransport = 'http';
    next();
  });

  return this;
};

Api.prototype.addHttpTransport = function() {
  this.post('/:version', (req, res, next) => this.hahdleHttpRequest(req, res, next));
  return this;
};

Api.prototype.addWSTransport = function(ws) {
  this.ws = ws;
  ws.on('message', (connection, message) => this.handleWSRequest(connection, message));
  return this;
};

Api.prototype.addResource = function(ns, api) {
  api.calls && api.calls.forEach( method => {
    if (typeof api[method] !== 'function') {
      this.logger.warn({
        resource: ns,
        method
      }, 'no method in the api');
      return;
    }

    let name = `${ns}.${method}`;
    let schema;

    try {
      schema = api[method + 'Schema']();
    } catch (e) {
      console.log(`${name} schema not found`);
      throw e;
    }

    let rpc = this.rpc[name] = {
      ctx: api,
      method: method,
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

Api.prototype.hahdleHttpRequest = function(req, res) {
  if (req.body instanceof Error) {
    this.onError(null, res, req.body);
  } else {
    this.onMessage(req.body, res, req);
  }
};

Api.prototype.handleWSRequest = function(connection, message) {
  let version = connection.upgradeReq.url.match(rxVersion);
  if (!version) {
    return; //skip, not api message
  }

  version = parseInt(version[1], 10);
  connection.mmpVersion = version;
  connection.mmpTransport = 'ws';

  let body = this.protocols[version].ws.request(connection, message);
  connection.body = body;

  if (body instanceof Error) {
    this.onError(null, connection, body);
  } else {
    this.onMessage(body, connection);
  }
};

Api.prototype.onMessage = function(msg, connection, req) {
  let c = this.rpc[msg.call];
  if (!c) {
    return this.onMethodNotFound(msg, connection);
  }

  if (msg.head || c.auth.required ) {
    this.auth.verify(c.auth, msg.head, (err, auth) => {
      if (err && c.auth.required === true) {
        return this.onAuthError(msg.id, connection);
      }
      this.callResource(c, auth, msg, connection, req);
    });
  } else {
    this.callResource(c, null, msg, connection, req);
  }
};

Api.prototype.callResource = function(c, auth, msg, connection, req) {
  let id = msg.id;

  if (c.raw) {
    return c.ctx[c.method](auth, req || connection, (err, result) => this.onCallResult(id, connection, c, err, result));
  }

  if (c.request && !c.request(msg.body)) {
    return this.onRequestValidationError(id, connection, c.request.errors);
  }

  c.ctx[c.method](auth, msg.body, (err, result) => this.onCallResult(id, connection, c, err, result));
};

Api.prototype.onCallResult = function(id, connection, c, err, result) {
  if (err) {
    return this.onError(id, connection, err.code ? err : errors.Call(err));
  }

  if (c.response && !c.response(result)) {
    return this.onResponseValidationError(id, connection, c.response.errors)
  }

  this.onSuccess(id, connection, result);
};

Api.prototype.onMethodNotFound = function(data, connection) {
  this.send({
    call: errors.MethodNotFound(data.call),
    id: data.id
  }, connection);
};

Api.prototype.onAuthError = function(id, connection) {
  this.send({
    call: errors.Unauthorized(),
    id: id
  }, connection);
};

Api.prototype.onRequestValidationError = function(id, connection, errs) {
  this.send({
    call: errors.RequestValidation(errs),
    id: id
  }, connection);
};

Api.prototype.onResponseValidationError = function(id, connection, errs) {
  this.send({
    call: errors.ResponseValidation(errs),
    id: id
  }, connection);
};

Api.prototype.onError = function(id, connection, err) {
  this.send({
    call: err,
    id: id
  }, connection);
};

Api.prototype.onSuccess = function(id, connection, res) {
  this.send({
    body: res,
    id: id
  }, connection);
};

Api.prototype.send = function(data, connection) {
  let logger = this.logger;
  this.protocols[connection.mmpVersion][connection.mmpTransport].response(connection, data, function(err) {
    err && logger.error({
      version: connection.mmpVersion,
      transport: connection.mmpTransport,
      error: err
    }, 'send failed');
  });
};


module.exports = Api;
