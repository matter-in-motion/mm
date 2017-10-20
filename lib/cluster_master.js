'use strict';
const inherits = require('util').inherits;
const AppBase = require('./app_base');

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
  let result = null;
  if (!cluster.isDisabled) {
    cluster.start();
  } else {
    const worker = this.loader.getWorker();
    result = worker.start();
    if (!result) {
      result = worker;
    }
  }

  this.didStart();
  this.reportStartupTime('Cluster');
  return result;
};


module.exports = ClusterMaster;
