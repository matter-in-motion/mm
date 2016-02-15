'use strict';
const inherits = require('util').inherits;

//--- ugly express router nature
let Router = function(opts) {
  opts = opts || {};

  this.params = {};
  this._params = [];
  this.caseSensitive = opts.caseSensitive;
  this.mergeParams = opts.mergeParams;
  this.strict = opts.strict;
  this.stack = [];
};
Router.prototype = Object.create(require('express').Router().__proto__);
//---

let Contract = function(opts) {
  Router.call(this, opts);
};
inherits(Contract, Router);

Contract.prototype.unitInit = function(units) {
  this.units = units;
};

Contract.prototype.use = function(path, contract) {
  if (!contract) {
    contract = path;
    path = '/';
  }

  if (contract.handle) {
    Contract.super_.prototype.use.call(this, path, (req, res, next) => contract.handle(req, res, next));
  } else {
    Contract.super_.prototype.use.call(this, path, contract);
  }
  return this;
};

Contract.prototype.addView = function(path, viewName) {
  let units = this.units;
  let view = units.require(viewName);

  this.get(path, function(req, res) {
    view.get(req, res);
  });

  return this;
};

Contract.prototype.addViews = function(views) {
  for (let path in views) {
    this.addView(path, views[path]);
  }
};

module.exports = Contract;
