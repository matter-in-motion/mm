'use strict';
const WSServer = require('uws').Server;

var Transport = function() {};

Transport.prototype.name = 'websockets';

Transport.prototype.unitInit = function(units) {
  this.units = units;
  const settings = units.require('core.settings').core;
  this.debug = settings.debug;
  this.settings = settings.websockets;

  this.logger = units.require('core.logger').get('websockets');
  const web = units.requireInited('core.transport.http');
  this.createServer(web);
};

Transport.prototype.createServer = function(web) {
  this.server = new WSServer({ server: web.server })
    .on('connection', ws => this._onConnect(ws))
    .on('error', err => this._onError(null, err));

  this.server.startAutoPing(this.settings.pingInterval);
};

Transport.prototype._onConnect = function(connection) {
  connection
    .on('close', () => this._onClose(connection))
    .on('error', err => this._onError(connection, err))
    .on('message', (data, flags) => this._onMessage(connection, data, flags));
    // .on('ping', (data, flags) => connection.pong(data, flags))

  connection.url = connection.upgradeReq.url;
  this.onConnect && this.onConnect(connection);
};

Transport.prototype._onError = function(connection, err) {
  this.logger.error(err);
};

Transport.prototype._onClose = function(connection) {
  connection.closed && connection.closed();
  this.onClose && this.onClose(connection);
};

Transport.prototype._onMessage = function(connection, message) {
  this.onMessage(connection, message);
};

module.exports = Transport;
