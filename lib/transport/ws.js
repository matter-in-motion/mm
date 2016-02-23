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
  this.debug = settings.debug;
  this.settings = settings.websockets;

  this.logger = units.require('core.logger').get('websockets');
  let web = units.requireInited('core.transport.http');
  this.createServer(web);
};

Transport.prototype.createServer = function(web) {
  this.server = new WSServer({ server: web.server })
    .on('connection', ws => this.onConnect(ws))
    .on('error', err => this.onError(null, err));
};

Transport.prototype.onConnect = function(connection) {
  connection
    .on('close', () => this.onDisconnect(connection))
    .on('error', err => this.onError(connection, err))
    .on('message', (data, flags) => this.onMessage(connection, data, flags))
    .on('pong', (data, flags) => this.onPong(connection, data, flags))
    .on('ping', (data, flags) => connection.pong(data, flags))

  connection.pingCounter = 0;
  connection.lastTimeStamp = Date.now();
  this.ping(connection);
  this.emit('connect', connection);
};

Transport.prototype.onError = function(connection, err) {
  this.logger.error(err);
};

Transport.prototype.onDisconnect = function(connection) {
  clearInterval(connection.pingInterval);
  this.emit('disconnect', connection);
};

Transport.prototype.onMessage = function(connection, message) {
  connection.pingCounter = 0;
  connection.lastTimeStamp = Date.now();
  this.emit('message', connection, message);
};

Transport.prototype.onPong = function(connection, data, flags) {
  connection.pingCounter--;
};

Transport.prototype.ping = function(connection) {
  let interval = this.settings.pingInterval;
  let fails = this.settings.pingFails;

  connection.pingInterval = setInterval(() => {
    if (Date.now() - connection.lastTimeStamp >= interval) {
      if (connection.pingCounter >= fails) {
        return this.onDisconnect(connection);
      }

      try {
        connection.lastTimeStamp = Date.now();
        connection.pingCounter++;
        connection.ping();
      } catch (e) {
        this.onDisconnect(connection);
      }
    }
  }, interval);
};

module.exports = Transport;
