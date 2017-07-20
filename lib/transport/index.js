'use strict';
const inherits = require('util').inherits;
const EventEmitter = require('events');

const Transport = function() {
  EventEmitter.call(this)
};
inherits(Transport, EventEmitter);

Transport.prototype.unitIsInitRequired = true;

Transport.prototype.unitInit = function(units) {
  const modules = units.require('core.app').modules;
  const transports = units.require('core.settings').core.transports;
  const logger = units.require('core.logger');

  if (!transports || !Object.keys(transports).length) {
    throw Error('At least one transport should be defined');
  }

  this.transports = Object.keys(transports);
  this.transports.forEach(name => {
    const transportLogger = logger.get(name, { unit: name });
    const Transport = require(modules + '/mm-' + name);
    const transport = this[name] = new Transport({
      connect: connection => this.emit('connect', connection),
      message: msg => {
        msg.transport = name;
        this.emit('message', msg);
      },
      error: err => {
        transportLogger.error(err);
        this.emit('error', err);
      },
      close: connection => this.emit('close', connection)
    });

    units.expose('core.transport.' + name, transport);
    transport.unitInit(units);
  });
};

Transport.prototype.start = function() {
  this.transports.forEach(name => this[name].start());
};

Transport.prototype.response = function(msg) {
  this[msg.transport].response(msg);
};


module.exports = Transport;
