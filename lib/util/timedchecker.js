'use strict';

class TimedChecker {
  constructor(checkFunc, checkInterval) {
    this.checkFunc = checkFunc;
    this.checkInterval = checkInterval;
    this.items = {};
    this.itemCount = 0;
    this.checkIntervalId = null;
  }

  add(k) {
    this.items[k] = null;
    this.itemCount++;
    if (!this.checkIntervalId) {
      this.checkIntervalId = setInterval(() => this.checkFunc(), this.checkInterval);
    }
  }

  remove(k) {
    delete this.items[k];
    this.itemCount--;
    if (this.itemCount === 0 && this.checkTimeout) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }
}

module.exports = TimedChecker;
