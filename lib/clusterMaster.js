'use strict';
const inherits = require('util').inherits;
const AppBase = require('./appBase');

const ClusterMaster = function(opts) {
  AppBase.call(this, opts);
};
inherits(ClusterMaster, AppBase);

ClusterMaster.prototype.willInit = function() {
  this.loadCore('cluster');
};

ClusterMaster.prototype.start = function() {
  this.ensureInited();
  const cluster = this.units.require('core.cluster');
  if (!cluster.disabled) {
    return cluster.start();
  }

  const worker = this.loader.getWorker();
  const result = worker.start() || worker;

  this.didStart();
  this.reportStartupTime('Cluster');
  return result;
};


module.exports = ClusterMaster;
