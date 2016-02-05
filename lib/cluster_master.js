'use strict';
const inherits = require('util').inherits;
const AppBase = require('./app_base');

let ClusterMaster = function(opts) {
  AppBase.call(this, opts);
};
inherits(ClusterMaster, AppBase);

ClusterMaster.prototype.addUnits = function() {
};

ClusterMaster.prototype.start = function() {
  this.ensureInited();
  let cluster = this.units.require('core.cluster');
  let result = null;
  if (!cluster.isDisabled) {
    cluster.start();
  } else {
    let worker = this.loader.getWorker();
    result = worker.start();
    if (!result) {
      result = worker;
    }
  }

  this.reportStartupTime('Cluster');
  return result;
};


module.exports = ClusterMaster;
