'use strict';
const test = require('ava');
const Loader = require('../lib/loader');
process.env.NODE_ENV = '';

const loader = Loader.create({ env: '' });
const app = loader.getWorker().ensureInited();
const logger = app.units.require('core.logger');

test('get the default logger', t => {
  const def = logger.get();
  t.true(typeof def.info === 'function');
  t.true(typeof def.error === 'function');
  t.true(typeof def.fatal === 'function');
  t.true(typeof def.debug === 'function');
})

test('get the named logger', t => {
  const userlog = logger.get('user');
  t.true(typeof userlog.info === 'function');
  t.true(typeof userlog.error === 'function');
  t.true(typeof userlog.fatal === 'function');
  t.true(typeof userlog.debug === 'function');
})

test('get the existed named logger', t => {
  const userlog = logger.get('user');
  t.true(typeof userlog.info === 'function');
  t.true(typeof userlog.error === 'function');
  t.true(typeof userlog.fatal === 'function');
  t.true(typeof userlog.debug === 'function');

  t.true(userlog === logger.get('user'));
})
