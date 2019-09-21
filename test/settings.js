'use strict';
const test = require('ava');
const path = require('path');
const Loader = require('../lib/loader');
process.env.NODE_ENV = '';

const loader = Loader.create({ env: '' });
const app = loader.getWorker().ensureInited();
const settings = app.units.require('core.settings');

test('gets the absolute path', t => {
  const p = settings.joinPath('lib');
  t.is(p, path.join(process.cwd(), 'lib'));
})

test('fails on require', t => {
  const err = t.throws(() => settings.require('test'));
  t.is(err.message, '\'test\' settings is required');
})

test('applies the settings from the object', t => {
  settings.apply({
    test: 'test'
  })

  t.is(settings.test, 'test');
})

test('does not fails on require', t => {
  const test = settings.require('test');
  t.is(test, 'test');
})

test('fails to apply settings from file', t => {
  const err = t.throws(() => settings.apply('test'));
  t.true(err.message.startsWith('Cannot find module'));
})

test('applies settings from the file', t => {
  settings.apply('index');
  t.pass();
})
