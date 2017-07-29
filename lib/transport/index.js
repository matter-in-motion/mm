'use strict';
const inherits = require('util').inherits;
const EventEmitter = require('events');

const Transport = function() {
  EventEmitter.call(this)
};
inherits(Transport, EventEmitter);

Transport.prototype.__initRequired = true;

Transport.prototype.__init = function(units) {
  const transports = units.require('transports');
  const logger = units.require('core.logger');

  if (!transports) {
    throw Error('At least one transport should be defined');
  }

  this.transports = []
  transports.forEach((transport, name) => {
    this.transports.push(name);
    this[name] = transport;

    const transportLogger = logger.get(name, { unit: name });

    transport.connect = connection => this.emit('connect', connection);
    transport.message = msg => {
      msg.transport = name;
      this.emit('message', msg);
    };

    transport.error = err => {
      transportLogger.error(err);
      this.emit('error', err);
    };

    transport.close = connection => this.emit('close', connection);
  });
};

Transport.prototype.start = function() {
  this.transports.forEach(name => this[name].start());
};

Transport.prototype.response = function(msg) {
  this[msg.transport].response(msg);
};


module.exports = Transport;
