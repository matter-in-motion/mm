'use strict';
const prettyjson = require('prettyjson');

const group = function(groupName) {
  console.log(`\x1B[32m\x1B[1m${groupName}\x1B[22m\x1B[39m`);
};

const _error = function(err) {
  console.log('\x1B[31m\x1B[1mERROR >\x1B[22m\x1B[39m', err.msg || err.message || err);
};

const error = function(err) {
  if (Array.isArray(err)) {
    for (let i in err) {
      _error(err[i].msg || err[i].message);
    }
  } else {
    _error(err.msg || err.message);
  }
}

const ok = function(res) {
  console.log('\x1B[32m\x1B[1mOK >\x1B[22m\x1B[39m', typeof res === 'object' ? `\n${prettyjson.render(res)}` : res);
};

const message = function(msgs) {
  if (!msgs) {
    return;
  }

  if (Array.isArray(msgs)) {
    msgs.forEach(ok);
    return;
  }

  ok(msgs);
};

const done = function(res) {
  res && ok(res);
  console.log('\n\x1B[32m\x1B[1mDONE\x1B[22m\x1B[39m\n');
};

const progress = function(err, res) {
  if (err) {
    error(err.msg || err.message);
  } else {
    ok(res);
  }
};

const exit = function() {
  process.exit(0);
}

module.exports = {
  __expose: true,
  progress,
  error,
  ok,
  message,
  group,
  done,
  exit
};
