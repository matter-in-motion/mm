'use strict';
const test = require('ava');
const Loader = require('../lib/loader');
process.env.NODE_ENV = '';

test('creates loader instance and checks its state', t => {
  const loader = Loader.create({ env: '' });
  t.truthy(loader);
  t.truthy(loader.args);
  t.truthy(loader.commands);
  t.truthy(loader.commands.run);
  t.is(typeof loader.commands.run.call, 'function');
  t.truthy(loader.commands.start);
  t.is(typeof loader.commands.start.call, 'function');
  t.truthy(loader.commands.stop);
  t.is(typeof loader.commands.stop.call, 'function');
  t.truthy(loader.commands.restart);
  t.is(typeof loader.commands.restart.call, 'function');
  t.truthy(loader.commands.daemon);
  t.is(typeof loader.commands.daemon.call, 'function');
  t.truthy(loader.commands.worker);
  t.is(typeof loader.commands.worker.call, 'function');
  t.truthy(loader.commands.console);
  t.is(typeof loader.commands.console.call, 'function');
})

test('checks the help', t => {
  const loader = Loader.create({ env: '' });
  t.is(typeof loader.getHelp(), 'string');
})

test('adds command and runs it', t => {
  const loader = Loader.create({ env: '' });
  loader.add({
    test: {
      call: (str1, str2) => {
        t.is(str1, 'test1');
        t.is(str2, 'test2');
      }
    }
  });

  loader.run('test', 'test1', 'test2');
})

test('gets the loader', t => {
  const loader = Loader.create({ env: '' });
  const res = loader.getLoader();
  t.truthy(res);
})

test('gets the app', t => {
  const loader = Loader.create({ env: '' });
  const app = loader.getApp();
  t.truthy(app);
})

test('gets the cluster master', t => {
  const loader = Loader.create({ env: '' });
  const app = loader.getClusterMaster();
  t.truthy(app);
})

