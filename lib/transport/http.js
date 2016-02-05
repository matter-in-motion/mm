'use strict';
const http = require('http');
const https = require('https');
const express = require('express');

let Transport = function() {
  this.express = express();
  this.express.disable('x-powered-by');
  //apply all common middlewares here
};

Transport.prototype.name = 'http';

Transport.prototype.unitInit = function(units) {
  this.units = units;
  const settings = units.require('core.settings').core;
  this.settings = settings.http;

  this.debug = settings.debug;
  if (!settings.debug) {
    this.express.set('env', 'production');
  }

  if (settings.tls) {
    this.server = https.createServer(settings.tls, this.express);
  } else {
    this.server = http.createServer(this.express);
  }
};

Transport.prototype.start = function() {
  const settings = this.settings;
  this.server.listen(settings.port, settings.address, settings.backlog);
  return this;
};

module.exports = Transport;
