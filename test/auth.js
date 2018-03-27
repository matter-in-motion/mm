'use strict';
const test = require('ava');
const Loader = require('../lib/loader');
process.env.NODE_ENV = '';

const loader = Loader.create({ env: '' });
const app = loader.getWorker();
app.units.require('core.settings').auth = {
  test: {
    active: true,
    token: {
      key: 'test',
      algorithm: 'HS256',
      expiresIn: '1 minute',
      subject: 'test',
      issuer: 'test'
    }
  }
};

test('init the app', t => {
  app.ensureInited();
  app.units.require('core.auth');
  t.pass()
})

test('gets the test provider', t => {
  const auth = app.units.require('core.auth');
  const provider = auth.provider('test');
  t.true(provider.active);
});

test('creates and verifies hash', t => {
  const auth = app.units.require('core.auth');
  const provider = auth.provider('test');

  return provider.createHash('test')
    .then(hash => {
      t.true(typeof hash === 'string');
      return provider.verifyHash(hash, 'test');
    });
})

test('creates and fails to verify hash', t => {
  const auth = app.units.require('core.auth');
  const provider = auth.provider('test');

  return provider.createHash('test')
    .then(hash => provider.verifyHash(hash, 'wrong'))
    .catch(e => {
      t.is(e.message, 'Hash doesn\'t match a string');
    });
})

test('signs and verifies a token with default options', t => {
  const auth = app.units.require('core.auth');
  const provider = auth.provider('test');

  return provider.sign({ id: 'test' })
    .then(token => {
      t.is(typeof token.expires, 'number');
      t.is(typeof token.token, 'string');

      return provider.verify(token.token);
    })
})

test('fails to verify a token with wrong provider', t => {
  const auth = app.units.require('core.auth');
  return auth.verify({ provider: 'fail' }, 'token')
    .catch(e => t.is(e.code, 4104))
})

test('fails to verify an empty token', t => {
  const auth = app.units.require('core.auth');
  return auth.verify({ provider: 'test' })
    .catch(e => t.is(e.message, 'No token provided'))
})

test('signs and verifies a token with options', t => {
  const auth = app.units.require('core.auth');
  const provider = auth.provider('test');

  return provider
    .sign({ id: 'test' }, {
      expiresIn: '1 minute',
      audience: 'test',
      mixin: {
        some: 'data'
      }
    })
    .then(token => {
      t.is(typeof token.expires, 'number');
      t.is(typeof token.token, 'string');
      t.is(token.some, 'data');

      return auth.verify({
        provider: 'test',
        audience: 'test'
      }, token.token);
    })
})

test('fails to verify an future token', t => {
  const auth = app.units.require('core.auth');
  const provider = auth.provider('test');

  return provider
    .sign({ id: 'test' }, {
      expiresIn: '5 minute',
      notBefore: '1 minute'
    })
    .then(token => {
      t.is(typeof token.expires, 'number');
      t.is(typeof token.token, 'string');

      return provider.verify(token.token);
    })
    .catch(e => t.is(e.name, 'NotBeforeError'))
})
