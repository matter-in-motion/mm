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

Api.prototype.unitInitRequired = true;

Api.prototype.unitInit = function(units) {
  this.validator = units.require('core.validator');
  this.logger = units.require('core.logger').get('api');
  this.auth = units.require('core.auth');

  let apiRx = /^resources\.(.*)\.request$/;
  let loadedUnits = units.unitInfoDict;
  for (let i in loadedUnits) {
    let ns = i.match(apiRx);
    if (ns) {
      this.addResource(
        ns[1],
        units.get(i),
        units.get(i.replace('.request', '.response')),
        units.get(i.replace('.request', '.controller'))
      );
    }
  }

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
    console.log('version', version, typeof version);
    req.mmpVersion = version;
    res.mmpVersion = version;
    res.mmpTransport = 'http';
    next();
  });

  return this;
};

Api.prototype.addHttpTransport = function() {
  this.all('/:version', (req, res, next) => this.hahdleHttpRequest(req, res, next));
  return this;
};

Api.prototype.addWSTransport = function(ws) {
  this.ws = ws;
  ws.on('message', (connection, message) => this.handleWSRequest(connection, message));
  return this;
};

Api.prototype.addResource = function(ns, request, response, controller) {
  if (!response) {
    response = {};
  }

  for (let method in request.validators) {
    if (typeof controller[method] !== 'function') {
      this.logger.warn({
        controller: ns,
        method
      }, 'no method in the controller');
      return;
    }

    let name = `${ns}.${method}`;
    let req = request.validators[method]();

    let rpc = this.rpc[name] = {
      ctx: controller,
      method: method,
      auth: req.auth || 'required',
      raw: req.raw
    }

    if (req.schema) {
      rpc.request = this.validator.addSchema(name + ':request', req.schema);
    }

    if (this.debug && response.validators[method]) {
      rpc.response = this.validator.addSchema(name + ':response', response[method]());
    }
  }
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

  if (body instanceof Error) {
    this.onError(null, connection, body);
  } else {
    this.onMessage(body, connection);
  }
};

Api.prototype.onMessage = function(msg, connection, req) {
  const self = this;
  let c = this.rpc[msg.call];

  if (!c) {
    return this.onMethodNotFound(msg, connection);
  }

  if (msg.token || c.auth !== 'none') {
    this.auth.verify(msg.token, function(err, auth) {
      console.log('auth', err, auth);
      if (err && c.auth === 'required') {
        return self.onAuthError(msg.id, connection);
      }
      self.callResource(c, auth, msg, connection, req);
    })
  } else {
    this.callResource(c, null, msg, connection, req);
  }
};

Api.prototype.callResource = function(c, auth, msg, connection, req) {
  let id = msg.id;

  if (c.raw) {
    return c.ctx[c.method](auth, req || connection, (err, result) => this.onCallResult(id, connection, c, err, result));
  }

  if (c.request && !c.request(msg.data)) {
    return this.onRequestValidationError(id, connection, c.request.errors);
  }

  c.ctx[c.method](auth, msg.data, (err, result) => this.onCallResult(id, connection, c, err, result));
};

Api.prototype.onCallResult = function(id, connection, c, err, result) {
  if (err) {
    return this.onError(id, connection, errors.Call(err));
  }

  if (c.response && !c.response(result)) {
    return this.onResponseValidationError(id, connection, c.response.errors)
  }

  this.onSuccess(id, connection, result);
};

Api.prototype.onMethodNotFound = function(data, connection) {
  // console.log('1', data);
  this.send({
    call: errors.MethodNotFound(data.call),
    id: data.id
  }, connection);
};

Api.prototype.onAuthError = function(id, connection) {
  // console.log('2', id);
  this.send({
    call: errors.Unauthorized(),
    id: id
  }, connection);
};

Api.prototype.onRequestValidationError = function(id, connection, errs) {
  // console.log('3', id, errs);
  this.send({
    call: errors.RequestValidation(errs),
    id: id
  }, connection);
};

Api.prototype.onResponseValidationError = function(id, connection, errs) {
  // console.log('4', id, errs);
  this.send({
    call: errors.ResponseValidation(errs),
    id: id
  }, connection);
};

Api.prototype.onError = function(id, connection, err) {
  // console.log('5', id, err);
  this.send({
    call: err,
    id: id
  }, connection);
};

Api.prototype.onSuccess = function(id, connection, res) {
  // console.log('6', id, res);
  this.send({
    data: res,
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
