'use strict';
const Ajv = require('ajv');

const Validator = function() {
  this.v = undefined;
}

Validator.prototype.__initRequired = true;

Validator.prototype.__init = function(units) {
  const settings = units.require('core.settings').core.validator;
  this.v = new Ajv(settings);
};

Validator.prototype.validate = function(schemaOrRefOrKey, data) {
  return this.v.validate(schemaOrRefOrKey, data);
};

Validator.prototype.addMetaSchema = function(key, schema) {
  this.v.addMetaSchema(schema, key);
};

Validator.prototype.addSchema = function(key, schema) {
  try {
    this.v.addSchema(schema, key);
  } catch (e) {
    e.message = `${key} ${e.message}`;
    throw e;
  }
  return this.v.getSchema(key);
};

Validator.prototype.getSchema = function(key) {
  return this.v.getSchema(key);
};

Validator.prototype.removeSchema = function(schemaOrRefOrKey) {
  this.v.removeSchema(schemaOrRefOrKey);
};

Validator.prototype.addKeyword = function(keyword, opts) {
  this.v.addKeyword(keyword, opts);
};

Validator.prototype.compile = function(schema) {
  return this.v.compile(schema);
};

Validator.prototype.errorsText = function(errs, opts) {
  return this.v.errorsText(errs, opts);
};


module.exports = Validator;
