'use strict';
const test = require('ava');
const Loader = require('../lib/loader');
process.env.NODE_ENV = '';

test('starts the app', t => {
  const loader = Loader.create({ env: '' });
  const app = loader.getApp();
  app.start();
  t.true(app.inited);
})

test('starts the app without cluster', t => {
  const loader = Loader.create({ env: '' });
  const app = loader.getApp();
  const settings = app.units.require('core.settings');
  settings.core.cluster.disabled = true;
  app.start();
  t.true(app.inited);
})

test('starts the worker', t => {
  const loader = Loader.create({ env: '' });
  const app = loader.getWorker();
  app.start();
  t.true(app.inited);
})

test('starts the cluster', t => {
  const loader = Loader.create({ env: '' });
  const app = loader.getClusterMaster();
  app.start();
  t.true(app.inited);
})

/*test('print the units', t => {
  const loader = Loader.create({ env: '' });
  const app = loader.getApp();
  app.start();
  app.printUnits();
  t.true(app.inited);
})*/

test('calls the function in app context', t => {
  const loader = Loader.create({ env: '' });
  const app = loader.getWorker();
  app.call(function() {
    t.is(this, app);
  })
})

test('runs the command', t => {
  const loader = Loader.create({ env: '' });
  const app = loader.getWorker();
  app.add('commands', {
    test: {
      __expose: true,
      test: {
        description: 'test command',
        call: function() {
          t.is(this, app);
          t.pass()
        }
      }
    }
  })
  app.run('test', 'test');
})

test('runs the console', t => {
  const loader = Loader.create({ env: '' });
  const app = loader.getWorker();
  app.console();
  t.pass();
})

