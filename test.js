/*jshint node:true */
'use strict';

var assert = require('goinstant-assert');
var sinon = require('sinon');

// import sinon assertions
Object.keys(sinon.assert).forEach(function(assertion) {
  if (!assert[assertion] && typeof sinon.assert[assertion] === 'function') {
    assert[assertion] = sinon.assert[assertion].bind(sinon);
  }
});

var spin = require('./index');

describe('spin-test tests', function() {
  var clock;

  before(function() {
    clock = sinon.useFakeTimers();
  });

  after(function() {
    clock.restore();
  });

  it('exports a function', function() {
    assert.isFunction(spin);
  });

  it('spins just once on success', function() {
    var action = sinon.stub().yields(null);
    var check = sinon.stub();
    var finish = sinon.stub();

    var spinner = spin(action, check, finish);

    assert.notCalled(action);
    assert.notCalled(check);
    assert.notCalled(finish);

    // NOTE: this is just exposed to skip the setImmediate
    spinner.start();

    assert.calledOnce(action);
    assert.calledOnce(check);
    assert.calledOnce(finish);
  });

  it('calling start() twice does nothing', function() {
    var action = sinon.stub().yields(null);
    var check = sinon.stub();
    var finish = sinon.stub();

    var spinner = spin(action, check, finish);

    assert.notCalled(action);
    assert.notCalled(check);
    assert.notCalled(finish);

    spinner.start();

    assert.calledOnce(action);
    assert.calledOnce(check);
    assert.calledOnce(finish);

    spinner.start();

    // no change:
    assert.calledOnce(action);
    assert.calledOnce(check);
    assert.calledOnce(finish);
  });

  it('spins repeatedly on action failure', function() {
    var action = sinon.stub().yields(new Error('bad'));
    var check = sinon.stub();
    var finish = sinon.stub();

    var spinner = spin(action, check, finish);

    assert.notCalled(action);
    assert.notCalled(check);
    assert.notCalled(finish);

    spinner.start();

    assert.calledOnce(action);
    assert.notCalled(check);
    assert.notCalled(finish);

    clock.tick(spin.WAIT);

    assert.calledTwice(action);
    assert.notCalled(check);
    assert.notCalled(finish);

    clock.tick(spin.TIMEOUT - spin.WAIT);

    assert.callCount(action, 5);
    assert.notCalled(check);
    assert.calledOnce(finish);
    assert.calledWith(finish, sinon.match.instanceOf(Error));

    assert.isArray(spinner.errors);
    assert.lengthOf(spinner.errors, 5);
    for (var i = 0; i < spinner.errors.length; i++) {
      assert.instanceOf(spinner.errors[i], Error);
      assert.equal(spinner.errors[i].message, 'bad');
    }
  });

  it('spins repeatedly on check failure', function() {
    var action = sinon.stub().yields(null);
    var check = sinon.stub().throws(new Error('something is wrong'));
    var finish = sinon.stub();

    var spinner = spin(action, check, finish);

    assert.notCalled(action);
    assert.notCalled(check);
    assert.notCalled(finish);

    spinner.start();

    assert.calledOnce(action);
    assert.calledOnce(check);
    assert.notCalled(finish);

    clock.tick(spin.WAIT);

    assert.calledTwice(action);
    assert.calledTwice(check);
    assert.notCalled(finish);

    clock.tick(spin.TIMEOUT - spin.WAIT);

    assert.callCount(action, 5);
    assert.callCount(check, 5);
    assert.calledOnce(finish);
    assert.calledWith(finish, sinon.match.instanceOf(Error));

    assert.isArray(spinner.errors);
    assert.lengthOf(spinner.errors, 5);
    for (var i = 0; i < spinner.errors.length; i++) {
      assert.instanceOf(spinner.errors[i], Error);
      assert.equal(spinner.errors[i].message, 'something is wrong');
    }
  });

  it('can set custom intervals', function() {
    var action = sinon.stub().yields(null);
    var check = sinon.stub().throws(new Error('something is wrong'));
    var finish = sinon.stub();

    var spinner = spin(action, check, finish);
    assert.isObject(spinner);
    spinner.wait = 1;
    spinner.timeout = 2;

    assert.notCalled(action);
    assert.notCalled(check);
    assert.notCalled(finish);

    spinner.start();

    assert.calledOnce(action);
    assert.calledOnce(check);
    assert.notCalled(finish);

    clock.tick(1);

    assert.calledTwice(action);
    assert.calledTwice(check);
    assert.notCalled(finish);

    clock.tick(1);

    assert.calledThrice(action);
    assert.calledThrice(check);
    assert.calledOnce(finish);
    assert.calledWith(finish, sinon.match.instanceOf(Error));
  });

  it('rethrows "done" error', function() {
    var action = sinon.stub().yields(null);
    var check = sinon.stub().returns(null);
    var finish = sinon.stub().throws(new Error('done error'));

    var spinner = spin(action, check, finish);

    assert.notCalled(action);
    assert.notCalled(check);
    assert.notCalled(finish);

    try {
      spinner.start();
    } catch (e) {
      assert.calledOnce(action);
      assert.calledOnce(check);
      assert.equal(e.message, 'done error');
    }
  });

});
