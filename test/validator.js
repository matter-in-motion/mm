'use strict';
const test = require('ava');
const Loader = require('../lib/loader');
process.env.NODE_ENV = '';

const loader = Loader.create({ env: '' });
const app = loader.getWorker().ensureInited();
const v = app.units.require('core.validator');

test('adds schema', t => {
  v.addSchema('test', { type: 'string' })
  t.pass();
})

test('fails to add the same schema', t => {
  const err = t.throws(() => v.addSchema('test', { type: 'string' }))
  t.true(err.message === 'test schema with key or id "test" already exists');
})

test('validates against the schema', t => {
  v.validate('test', 'test');
  t.pass();
})

test('get the schema and validates against it', t => {
  const schema = v.getSchema('test');
  t.true(schema('test'));
})

test('get the schema validation errors', t => {
  const schema = v.getSchema('test');
  t.false(schema(1));
  t.truthy(schema.errors);
  const errors = v.errorsText(schema.errors);
  t.true(typeof errors === 'string');
})

test('compile schema', t => {
  const schema = v.compile({ type: 'string' });
  t.true(schema('test'));
})

test('removes schema', t => {
  v.removeSchema('test');
  const schema = v.getSchema('test');
  t.is(schema, undefined);
})


test('adds a keyword', t => {
  v.addKeyword('range', {
    type: 'number',
    compile: function(sch, parentSchema) {
      var min = sch[0];
      var max = sch[1];

      return parentSchema.exclusiveRange === true
              ? function (data) { return data > min && data < max; }
              : function (data) { return data >= min && data <= max; }
    }
  });

  const schema = v.compile({ 'range': [ 2, 4 ], 'exclusiveRange': true });
  t.true(schema(2.01));
  t.true(schema(3.99));
  t.false(schema(2));
  t.false(schema(4));
})

test('adds a metaschema', t => {
  v.addMetaSchema('test', require('ajv/lib/refs/json-schema-draft-06.json'));
  t.pass();
})
