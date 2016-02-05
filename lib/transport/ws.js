'use strict';
const inherits = require('util').inherits;
const EventEmitter = require('events').EventEmitter;
const WSServer = require('ws').Server;

var Transport = function() {
  EventEmitter.call(this);
};
inherits(Transport, EventEmitter);

Transport.prototype.name = 'websockets';

Transport.prototype.unitInit = function(units) {
  this.units = units;
  let settings = units.require('core.settings').core;
  this.debug = settings.debug

  this.logger = units.require('core.logger').get('websockets');
  let web = units.requireInited('core.transport.http');
  this.createServer(web);
};

Transport.prototype.createServer = function(web) {
  const self = this;

  this.server = new WSServer({ server: web.server })
    .on('connection', function(ws) {
      self.onConnect(ws);

      ws.on('message', function(message, flags) {
        self.onMessage(ws, message, flags);
      });

      ws.on('error', function(err) {
        self.logger.error(err);
      });

      ws.on('close', function() {
        self.onDisconnect(ws);
      });
    });
};

Transport.prototype.onConnect = function(connection) {
  this.emit('connect', connection);
};

Transport.prototype.onDisconnect = function(connection) {
  this.emit('disconnect', connection);
};

Transport.prototype.onMessage = function(connection, message) {
  this.emit('message', connection, message);
};

module.exports = Transport;
