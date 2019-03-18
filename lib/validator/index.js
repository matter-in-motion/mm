'use strict';
const Ajv = require('ajv');
const AjvKeywords = require('ajv-keywords');
const AjvMergePatch = require('ajv-merge-patch');

class Validator {
  constructor() {
    this.__initRequired = true;
  }

  __init(units) {
    const settings = units.require('core.settings').core.validator;
    const ajv = new Ajv(settings);
    AjvMergePatch(ajv);
    AjvKeywords(ajv);
    this.v = ajv;
  }

  validate(schemaOrRefOrKey, data) {
    return this.v.validate(schemaOrRefOrKey, data);
  }

  addMetaSchema(key, schema) {
    this.v.addMetaSchema(schema, key);
  }

  addSchema(key, schema) {
    try {
      this.v.addSchema(schema, key);
    } catch (e) {
      e.message = `${key} ${e.message}`;
      throw e;
    }
    return this.v.getSchema(key);
  }

  getSchema(key) {
    return this.v.getSchema(key);
  }

  removeSchema(schemaOrRefOrKey) {
    this.v.removeSchema(schemaOrRefOrKey);
  }

  addKeyword(keyword, opts) {
    this.v.addKeyword(keyword, opts);
  }

  compile(schema) {
    return this.v.compile(schema);
  }

  errorsText(errs, opts) {
    return this.v.errorsText(errs, opts);
  }
}


module.exports = Validator;
