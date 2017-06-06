'use strict';
const fs = require('fs');
const childProcess = require('child_process');

let Daemon = function() {
  this.settings = null;
};

Daemon.prototype.lockFailedExitCode = 1;
Daemon.prototype.startFailedExitCode = 2;
Daemon.prototype.stopFailedExitCode = 1;
Daemon.prototype.releaseLockFailedExitCode = 2;

Daemon.prototype.unitIsInitRequired = true;

Daemon.prototype.unitInit = function(units) {
  this.settings = units.require('core.settings').core.daemon;
};

Daemon.prototype.start = function() {
  let fd;
  try {
    fd = this.createLock();
  } catch (err) {
    this.reportLockFailed(err);
    process.exit(this.lockFailedExitCode);
  }

  let child = this.createProcess();
  this.reportStarted(child.pid);

  try {
    this.savePid(fd, child.pid);
  } catch (err) {
    this.reportSavePidFailed(err);
  }

  process.exit();
};

Daemon.prototype.stop = function(cb) {
  cb = cb || function(code) {
    process.exit(code);
  };
  this.stopInternal(cb);
};

Daemon.prototype.stopInternal = function(cb) {
  const pid = this.loadPid();
  if (!pid) {
    this.reportPidFileNotFound();
  } else if (isNaN(pid)) {
    this
      .reportBadPidFile()
      .releaseLockWithReport();
  } else {
    let notFound = false;
    try {
      process.kill(pid);
    } catch (err) {
      if (err.code === 'ESRCH') {
        notFound = true;
      } else {
        this.reportSignalFailed(err, pid);
        cb(this.stopFailedExitCode);
        return;
      }
    }

    if (notFound) {
      this
        .reportProcessNotFound(pid)
        .releaseLockWithReport();
    } else {
      this.reportSignalSent(pid);

      this.waitForExit(pid, () => {
        this
          .reportStopped()
          .releaseLockWithReport(true);

        cb();
      });
      return;
    }
  }
  cb();
};

Daemon.prototype.restart = function() {
  this.stop(() => this.start());
};

// internal stuff

Daemon.prototype.createLock = function() {
  let realPath;
  try {
    realPath = fs.realpathSync(this.settings.pidFile);
  } catch (err) {
    if (err.code === 'ENOENT') {
      realPath = this.settings.pidFile;
    } else {
      throw err;
    }
  }
  return fs.openSync(realPath, 'wx');
};

Daemon.prototype.releaseLock = function() {
  try {
    let realPath = fs.realpathSync(this.settings.pidFile);
    fs.unlinkSync(realPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
};

Daemon.prototype.releaseLockWithReport = function(skipSuccessReport) {
  try {
    this.releaseLock();
  } catch (err) {
    this.reportReleaseLockFailed(err);
    process.exit(this.releaseLockFailedExitCode);
  }

  if (!skipSuccessReport) {
    this.reportLockReleased();
  }
};

Daemon.prototype.createProcess = function() {
  let child;
  let exec = this.getStartExec();
  let args = this.getStartArgs();
  let options = this.getStartOptions();
  try {
    child = childProcess.spawn(exec, args, options);
  } catch (err) {
    this.startFailed(err);
  }
  return child;
};

Daemon.prototype.startFailed = function(err) {
  this.reportStartFailed(err);
  try {
    this.releaseLock();
  } catch (e) {
    this.reportReleaseLockFailed(e);
  }
  process.exit(this.startFailedExitCode);
};

Daemon.prototype.getStartExec = function() {
  return this.settings.start.exec;
};

Daemon.prototype.getStartArgs = function() {
  const startSettings = this.settings.start;
  let result;
  if (startSettings.args) {
    if (typeof startSettings.args === 'function') {
      result = startSettings.args(this);
    } else {
      result = startSettings.args;
    }
  }
  return result;
};

Daemon.prototype.getStartOptions = function() {
  let startSettings = this.settings.start;

  let stdio = 'ignore';
  if (startSettings.stdout || startSettings.stderr) {
    stdio = [ 'ignore' ];
    let stdout;
    if (startSettings.stdout) {
      try {
        stdout = fs.openSync(startSettings.stdout, 'a');
      } catch (err) {
        this.startFailed(err);
      }
    }
    stdio.push(!stdout ? 'ignore' : stdout);

    let stderr;
    if (startSettings.stderr) {
      if (stdout === stderr) {
        stderr = stdout;
      } else {
        try {
          stderr = fs.openSync(startSettings.stderr, 'a');
        } catch (err) {
          this.startFailed(err);
        }
      }
    }
    stdio.push(!stderr ? 'ignore' : stderr);
  }

  return {
    detached: true,
    stdio: stdio
  };
};

Daemon.prototype.savePid = function(fd, pid) {
  fs.truncateSync(fd, 0);

  let buffer = new Buffer(pid + '');
  let written = 0;
  do {
    written += fs.writeSync(fd, buffer, written, buffer.length, written);
  } while (written < buffer.length);
};

Daemon.prototype.loadPid = function() {
  let pidStr = null;
  try {
    pidStr = fs.readFileSync(this.settings.pidFile, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
  let result = null;
  if (pidStr) {
    result = parseInt(pidStr, 10);
  }
  return result;
};

Daemon.prototype.waitForExit = function(pid, cb) {
  setTimeout(() => this.checkIfExited(pid, cb), this.settings.exitCheckInterval);
};

Daemon.prototype.checkIfExited = function(pid, cb) {
  try {
    process.kill(pid);
  } catch (err) {
    if (err.code === 'ESRCH') {
      cb(); // process exited
      return;
    } else {
      this.reportSignalFailed(err, pid);
      process.exit(this.stopFailedExitCode);
    }
  }
  this.waitForExit(pid, cb);
};

Daemon.prototype.reportStarted = function(pid) {
  console.log(`Started with pid ${pid}`);
  return this;
};

Daemon.prototype.reportStartFailed = function(err) {
  console.log(`Failed to start: ${err.message}`);
  return this;
};

Daemon.prototype.reportLockFailed = function(err) {
  console.error(`Could not obtain lock. Already running?\nError: ${err.message}`);
  return this;
};

Daemon.prototype.reportSavePidFailed = function(err) {
  console.log('Failed to save pid to file:', err.message);
  return this;
};

Daemon.prototype.reportLockReleased = function() {
  console.log('Lock released');
  return this;
};

Daemon.prototype.reportReleaseLockFailed = function(err) {
  console.error(`Could not release lock: ${err.message}`);
  return this;
};

Daemon.prototype.reportStopped = function() {
  console.log('Stopped');
  return this;
};

Daemon.prototype.reportPidFileNotFound = function() {
  console.log('Pid file not found. Already stopped?');
  return this;
};

Daemon.prototype.reportBadPidFile = function() {
  console.log('Pid file is invalid, releasing lock...');
  return this;
};

Daemon.prototype.reportProcessNotFound = function(pid) {
  console.log(`Could not find process ${pid}. Already stopped?`);
  return this;
};

Daemon.prototype.reportSignalSent = function(pid) {
  console.log(`Sent termination signal to ${pid}`);
  return this;
};

Daemon.prototype.reportSignalFailed = function(err, pid) {
  console.error(`Failed to send signal to ${pid}: ${err.message}`);
  return this;
};


module.exports = Daemon;
