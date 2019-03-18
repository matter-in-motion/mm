'use strict';
const test = require('ava');
const Loader = require('../lib/loader');
process.env.NODE_ENV = '';


test('API does not exist without resources', t => {
  const loader = Loader.create({ env: '' });
  const app = loader.getWorker();
  app.ensureInited();
  const api = app.units.get('core.api');
  t.falsy(api);
})


