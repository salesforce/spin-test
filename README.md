# spin-test

Spin on a test until it passes.

Inspired by
http://sauceio.com/index.php/2011/04/how-to-lose-races-and-win-at-selenium/

SUPER handy for flakey selenium tests where the framework is racing ahead of
the browser.

# Installation

```sh
  npm install --save-dev spin-test
```

# Usage

This module exports a function `spin`.

```js
  var spin = require('spin-test');
```

## The Basics

All three parameters to `spin()` are Functions.

```
  function action(cb) {
    cb(null, result);
  }

  function check(result) {
    // throw or not
  }

  function done(err) {
    // conclude the test
  }

  spin(action, check, done);
```

The `action` will be executed on the next tick by `setImmediate` and runs
**asynchronously**. The callback results of the `action` (minus the first `err`
param) are passed to the `check`. If the `action` calls-back with an `err`, it
will be scheduled to run again after a short period (100ms by default).

The `check` Function runs **synchronously**. If the `check` doesn't throw,
`done` will get called.

If the `check` _does_ throw an exception, the `action` is scheduled to happen
again after a short period (100ms by default).  Once the spinner has been
running for a maximum amount of time (4000ms by default) `done` will get
called with an error.

## Configuring Intervals

You can affect all newly created spinners by setting spin package globals:

```js
  spin.TIMEOUT = 1000; // maximum run time of the spinner, in ms
  spin.WAIT = 10;      // time to wait between attempts, in ms
```

To restore these:

```js
  spin.TIMEOUT = spin.DEFAULT_TIMEOUT;
  spin.WAIT = spin.DEFAULT_WAIT;
```

Or, you can modify the times for each test:

```js
  var spinner = spin(action, check, done);
  spinner.timeout = 1000;
  spinner.wait = 10;
```

## Impatience

Want the `action` to run immediately, not after `setImmediate`? We got you covered.

```js
  spinner.start();
```

## Error Accumulator

The `.errors` property will be an array of Errors that occurred while spinning.

```js
  var spinner;

  function finish(err) {
    if (!err) {
      return done();
    }

    process.stderr.write("Oh my gawd, it's full of STACKS:\n");
    spinner.errors.forEach(function(e) {
      process.stderr.write(e.stack+"\n\n");
    );
  }

  spinner = spin(action, check, finish);
```

# Contributing

If you'd like to contribute to or modify spin-test, here's a quick guide
to get you started.

## Development Dependencies

- [node.js](http://nodejs.org) >= 0.10

## Set-Up

Download via GitHub and install npm dependencies:

```sh
git clone git@github.com:goinstant/spin-test.git
cd spin-test
npm install
```

## Testing

Testing is with the [mocha](https://github.com/visionmedia/mocha) framework.
Tests are located in the `test.js` file.

To run the tests:

```sh
npm test
```

## Publishing

1. `npm version patch` (increments `x` in `z.y.x`, then makes a commit for package.json, tags that commit)
2. `git push --tags origin master`
3. `npm publish`

Go to https://npmjs.org/package/spin-test and verify it published (can take several minutes)

# Support

Email [GoInstant Support](mailto:support@goinstant.com) or stop by [#goinstant on freenode](irc://irc.freenode.net#goinstant).

For responsible disclosures, email [GoInstant Security](mailto:security@goinstant.com).

To [file a bug](https://github.com/goinstant/spin-test/issues) or
[propose a patch](https://github.com/goinstant/spin-test/pulls),
please use github directly.

# Legal

&copy; 2013 GoInstant Inc., a salesforce.com company

Licensed under the BSD 3-clause license.
