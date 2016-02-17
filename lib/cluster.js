'use strict';
const cluster = require('cluster');
const os = require('os');
const TimedChecker = require('./util/timedchecker');

let Cluster = function() {
  this.workersInfo = {};
};

Cluster.prototype.unitIsInitRequired = true;

Cluster.prototype.unitInit = function(units) {
  this.settings = units.require('core.settings').core.cluster;
  this.logger = units.require('core.logger').get('cluster');
  this.isDisabled = this.settings.disabled;
  this.numberOfWorkers = this.settings.numberOfWorkers || os.cpus().length;
};

Cluster.prototype.createLazyChecker = function() {
  const self = this;
  return new TimedChecker(function() {
    self.checkLazy(this.items);
  }, this.settings.checks.lazy.interval);
};

Cluster.prototype.createZombieChecker = function() {
  const self = this;
  return new TimedChecker(function() {
    self.checkZombie(this.items);
  }, this.settings.checks.zombie.interval);
};

Cluster.prototype.start = function() {
  this
    .setupMaster()
    .createCheckers()
    .initListeners()
    .forkWorkers();
};

Cluster.prototype.setupMaster = function() {
  let masterSettings = this.settings.master;
  let settings = {};
  if (masterSettings) {
    if (masterSettings.exec) {
      settings.exec = masterSettings.exec;
    }

    if (masterSettings.args) {
      if (typeof masterSettings.args === 'function') {
        settings.args = masterSettings.args(this);
      } else {
        settings.args = masterSettings.args;
      }
    }

    if (masterSettings.silent !== undefined) {
      settings.silent = masterSettings.silent;
    }
  }
  cluster.setupMaster(settings);
  return this;
};

Cluster.prototype.createCheckers = function() {
  this.lazyChecker = this.createLazyChecker();
  this.zombieChecker = this.createZombieChecker();
  return this;
};

Cluster.prototype.initListeners = function() {
  const self = this;
  cluster.on('fork', function(worker) {
    self.onWorkerFork(worker);
  });
  cluster.on('online', function(worker) {
    self.onWorkerOnline(worker);
  });
  cluster.on('listening', function(worker, address) {
    self.onWorkerListening(worker, address);
  });
  cluster.on('disconnect', function(worker) {
    self.onWorkerDisconnect(worker);
  });
  cluster.on('exit', function(worker, code, signal) {
    self.onWorkerExit(worker, code, signal);
  });

  return this;
};

Cluster.prototype.forkWorkers = function() {
  for (let i = 0; i < this.numberOfWorkers; i++) {
    cluster.fork();
  }

  if (this.numberOfWorkers < 1) {
    this.logger.fatal({ workers: this.numberOfWorkers }, 'no workers forked');
  } else {
    this.logger.info({ workers: this.numberOfWorkers }, `${this.numberOfWorkers} workers forked`);
  }

  return this;
};

Cluster.prototype.handleWorkerStateChange = function(worker, state, data, message, logLevel) {
  this.updateWorkerInfo(worker, state, data);
  this.reportWorkerStateChange(worker, state, data, message, logLevel);
};

Cluster.prototype.updateWorkerInfo = function(worker, state, data) {
  let info;
  if (state === 'fork') {
    this.workersInfo[worker.id] = info = {
      stateHistory: {}
    };
  } else {
    info = this.workersInfo[worker.id];
  }

  info.state = state;
  let historyItem = {
    date: new Date()
  };
  if (data) {
    historyItem.data = data;
  }
  info.stateHistory[state] = historyItem;
};

Cluster.prototype.reportWorkerStateChange = function(worker, state, data, message, logLevel) {
  logLevel = logLevel || 'debug';

  this.logger[logLevel]({
    worker: {
      id: worker.id,
      state: state
    }
  }, message);
};

Cluster.prototype.onWorkerFork = function(worker) {
  this.lazyChecker.add(worker.id);
  this.handleWorkerStateChange(worker, 'fork');
};

Cluster.prototype.onWorkerOnline = function(worker) {
  this.handleWorkerStateChange(worker, 'online');
};

Cluster.prototype.onWorkerListening = function(worker, address) {
  this.lazyChecker.remove(worker.id);
  this.handleWorkerStateChange(worker, 'listening', address, this.getWorkerListeningMsg(worker, address));
};

Cluster.prototype.getWorkerListeningMsg = function(worker, address) {
  return `${address.address}:${address.port}`;
};

Cluster.prototype.onWorkerDisconnect = function(worker) {
  let info = this.workersInfo[worker.id];
  // WARN workaround, sometimes getting exit before disconnect
  if (info && !info.stateHistory.exit) {
    this.zombieChecker.add(worker.id);
    this.handleWorkerStateChange(worker, 'disconnect');
  }
};

Cluster.prototype.onWorkerExit = function(worker, code, signal) {
  this.zombieChecker.remove(worker.id);
  cluster.fork();
  let logLevel = (worker.suicide ? null : 'fatal');
  this.handleWorkerStateChange(worker, 'exit', {
    code: code,
    signal: signal,
    isSuicide: worker.suicide
  }, this.getWorkerExitMsg(worker, code, signal), logLevel);
  delete this.workersInfo[worker.id];
};

Cluster.prototype.getWorkerExitMsg = function(worker, code, signal) {
  let msg = `code = ${code}`;

  if (worker.suicide) {
    msg += ', suicide';
  } else if (signal !== undefined) {
    msg += `, signal = ${signal}`;
  }
  return msg;
};

Cluster.prototype.checkLazy = function(items) {
  for (let k in items) {
    let info = this.workersInfo[k];
    if (info && info.stateHistory.listening && (Date.now() - info.stateHistory.fork.date) > this.settings.checks.lazy.maxTime) {
      this
        .reportLazy(k)
        .lazyChecker.remove(k); // report once
    }
  }
};

Cluster.prototype.reportLazy = function(workerId) {
  this.logger.fatal({ workerId }, 'lazy worker detected');
  return this;
};

Cluster.prototype.checkZombie = function(items) {
  for (let k in items) {
    let info = this.workersInfo[k];
    if (info && info.stateHistory.exit && (Date.now() - info.stateHistory.disconnect.date) > this.settings.checks.zombie.maxTime) {
      this
        .reportZombie(k)
        .zombieChecker.remove(k); // report once
    }
  }
  return this;
};

Cluster.prototype.reportZombie = function(workerId) {
  this.logger.fatal({ workerId }, 'zombie worker detected');
  return this;
};


module.exports = Cluster;
