/*jshint node:true */
'use strict';
/**
 * @fileOverview
 * Inspired by
 * http://sauceio.com/index.php/2011/04/how-to-lose-races-and-win-at-selenium/
 *
 * SUPER handy for flakey selenium tests where the framework is racing ahead of
 * the browser.
 */

// defaults; don't change these

spin.DEFAULT_TIMEOUT = 4000;
spin.DEFAULT_WAIT = 1000;

// tets can change these

spin.TIMEOUT = spin.DEFAULT_TIMEOUT;
spin.WAIT = spin.DEFAULT_WAIT;

/**
 * Spin on an action until the check completes.
 *
 * Returns a Spinner object that you can set custom timeouts and wait periods
 * on.  See README.md for usage.
 *
 * @param {function} action
 * @param {function} check
 * @param {function} done
 * @return {Spinner}
 */
function spin(action, check, done) {
  var spinner = new Spinner(action, check, done);
  setImmediate(spinner.start);
  return spinner;
}

module.exports = spin;

function Spinner(action, check, done) {
  this._startedAt = Date.now();
  this._action = action;
  this._check = check;
  this._done = done;
  this._started = false;

  this.timeout = spin.TIMEOUT;
  this.wait = spin.WAIT;
  this.errors = [];

  this._spin = this._spin.bind(this);
  this._tryCheck = this._tryCheck.bind(this);
  this.start = this.start.bind(this);
}

Spinner.prototype.start = function() {
  if (this._started) {
    return;
  }
  this._started = true;
  this._spin();
};

Spinner.prototype._spin = function() {
  this._action(this._tryCheck);
};

Spinner.prototype._tryCheck = function(err) {
  if (!err) {
    var args = Array.prototype.slice.call(arguments, 1);
    try {
      this._check.apply(this, args);
    } catch(e) {
      err = e;
    }
  }

  if (!err) { // still no error? check passed!
    return this._finish();
  }

  // have an err
  this.errors.push(err);
  if (Date.now() - this._startedAt >= this.timeout) {
    var msg = err.stack || err.message || err;
    this._finish(new Error('Spin Timeout, most recent error: '+msg));
  } else {
    setTimeout(this._spin, this.wait);
  }
};

Spinner.prototype._finish = function(err) {
  var done = this._done;

  delete this._done;
  delete this._action;
  delete this._check;

  // bindings
  delete this._spin;
  delete this._tryCheck;
  delete this.start;

  done(err);
};

