'use strict';
const prettyjson = require('prettyjson');

const group = function(groupName) {
  console.log('\x1B[32m\x1B[1m' + groupName + '\x1B[22m\x1B[39m');
};

const error = function(err) {
  console.log('\x1B[31m\x1B[1mERROR >\x1B[22m\x1B[39m', err);
};

const ok = function(res) {
  console.log('\x1B[32m\x1B[1mOK >\x1B[22m\x1B[39m', typeof res === 'object' ? '\n' + prettyjson.render(res) : res);
};

const progress = function(err, res) {
  if (err) {
    error(err.msg || err.message);
  } else {
    ok(res);
  }
};

const done = function(err, res) {
  if (err) {
    if (Array.isArray(err)) {
      for (let i in err) {
        error(err[i].msg || err[i].message);
      }
    } else {
      error(err.msg || err.message);
    }

    console.log('');
  } else {
    res && ok(res);
    console.log('\x1B[32m\x1B[1mDONE\x1B[22m\x1B[39m\n');
  }
  process.exit(0);
};


module.exports = {
  progress: progress,
  error: error,
  ok: ok,
  group: group,
  done: done
};
