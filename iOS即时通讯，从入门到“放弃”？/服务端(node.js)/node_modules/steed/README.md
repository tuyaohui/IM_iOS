![logo][logo-url]

# steed

[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Dependency Status][david-badge]][david-url]

Horsepower for your modules.

__Steed__ is an alternative to [async](http://npm.im/async) that is
~50-100% faster. It is not currently on-par with async in term of features.
Please help us!

* <a href="#install">Installation</a>
* <a href="#api">API</a>
* <a href="#caveats">Caveats</a>
* <a href="#why">Why it is so fast?</a>
* <a href="#acknowledgements">Acknowledgements</a>
* <a href="#licence">Licence &amp; copyright</a>

[![js-standard-style](https://raw.githubusercontent.com/feross/standard/master/badge.png)](https://github.com/feross/standard)

Watch Matteo presenting Steed at Node.js Interactive 2015: https://www.youtube.com/watch?v=_0W_822Dijg.

## Install

`npm i steed --save`

## API

* <a href="#steed"><code><b>steed()</b></code></a>
* <a href="#parallel"><code>steed#<b>parallel()</b></code></a>
* <a href="#series"><code>steed#<b>series()</b></code></a>
* <a href="#waterfall"><code>steed#<b>waterfall()</b></code></a>
* <a href="#each"><code>steed#<b>each()</b></code></a>
* <a href="#eachSeries"><code>steed#<b>eachSeries()</b></code></a>
* <a href="#map"><code>steed#<b>map()</b></code></a>
* <a href="#mapSeries"><code>steed#<b>mapSeries()</b></code></a>
* <a href="#queue"><code>steed#<b>queue()</b></code></a>

-------------------------------------------------------
<a name="steed"></a>
### steed()

Build an instance of steed, this step is not needed but welcomed for
greater performance. Each steed utility likes being used for the same
purpose.

-------------------------------------------------------
<a name="parallel"></a>
### steed.parallel([that,] tasks[, done(err, results)])

Executes a series of tasks in parallel.

`tasks` can either be an array of functions, or an object where each
property is a function. `done` will be called with the results.
The `that` argument will set `this` for each task and `done` callback.

Uses [fastparallel](http://npm.im/fastparallel).

Example:

```js
var steed = require('steed')()
// or
// var steed = require('steed')

steed.parallel([
  function a (cb){
    cb(null, 'a');
  },
  function b (cb){
    cb(null, 'b');
  }
], function(err, results){
  // results is ['a', 'b']
})


// an example using an object instead of an array
steed.parallel({
  a: function a1 (cb){
    cb(null, 1)
  },
  b: function b1 (cb){
    cb(null, 2)
  }
}, function(err, results) {
  // results is  { a: 1, b: 2}
})

// an example using that parameter
// preferred form for max speed
function run (prefix, a, b, cb) {
  steed.parallel(new State(prefix, a, b, cb), [aT, bT], doneT)
}

// can be optimized by V8 using an hidden class
function State (prefix, a, b, cb) {
  this.a = a
  this.b = b
  this.cb = cb
  this.prefix = prefix
}

// because it is not a closure inside run()
// v8 can optimize this function
function aT (cb){
  cb(null, this.a);
}

// because it is not a closure inside run()
// v8 can optimize this function
function bT (cb){
  cb(null, this.b);
}

// because it is not a closure inside run()
// v8 can optimize this function
function doneT (err, results) {
  if (results) {
    results.unshift(this.prefix)
    results = results.join(' ')
  }
  this.cb(err, results)
}

run('my name is', 'matteo', 'collina', console.log)
```

Benchmark for doing 3 calls `setImmediate` 1 million times:

* non-reusable `setImmediate`: 1781ms
* `async.parallel`: 3484ms
* `neoAsync.parallel`: 2162ms
* `insync.parallel`: 10252ms
* `items.parallel`: 3725ms
* `parallelize`: 2928ms
* `fastparallel` with results: 2139ms

These benchmarks where taken on node v4.1.0, on a MacBook
Pro Retina Mid 2014 (i7, 16GB of RAM).

-------------------------------------------------------
<a name="series"></a>
### steed.series([that,] tasks[, done(err, results)])

Executes a series of tasks in series.

`tasks` can either be an array of functions, or an object where each
property is a function. `done` will be called with the results.
The `that` argument will set `this` for each task and `done` callback.

Uses [fastseries](http://npm.im/fastseries).

Example:

```js
var steed = require('steed')()
// or
// var steed = require('steed')

steed.series([
  function a (cb){
    cb(null, 'a');
  },
  function b (cb){
    cb(null, 'b');
  }
], function(err, results){
  // results is ['a', 'b']
})


// an example using an object instead of an array
steed.series({
  a: function a (cb){
    cb(null, 1)
  },
  b: function b (cb){
    cb(null, 2)
  }
}, function(err, results) {
  // results is  { a: 1, b: 2}
})

// an example using that parameter
// preferred form for max speed
function run (prefix, a, b, cb) {
  steed.series(new State(prefix, a, b, cb), [aT, bT], doneT)
}

// can be optimized by V8 using an hidden class
function State (prefix, a, b, cb) {
  this.a = a
  this.b = b
  this.cb = cb
  this.prefix = prefix
}

// because it is not a closure inside run()
// v8 can optimize this function
function aT (cb){
  cb(null, this.a);
}

// because it is not a closure inside run()
// v8 can optimize this function
function bT (cb){
  cb(null, this.b);
}

// because it is not a closure inside run()
// v8 can optimize this function
function doneT (err, results) {
  if (results) {
    results.unshift(this.prefix)
    results = results.join(' ')
  }
  this.cb(err, results)
}

run('my name is', 'matteo', 'collina', console.log)
```

Benchmark for doing 3 calls `setImmediate` 1 million times:

* non-reusable `setImmediate`: 3887ms
* `async.series`: 5981ms
* `neoAsync.series`: 4338ms
* `fastseries` with results: 4096ms

These benchmarks where taken on node v4.2.2, on a MacBook
Pro Retina Mid 2014 (i7, 16GB of RAM).

-------------------------------------------------------
<a name="waterfall"></a>
### steed.waterfall(tasks[, done(err, ...)])

Runs the functions in `tasks` in series, each passing their result to
the next task in the array. Quits early if any of the tasks errors.

Uses [fastfall](http://npm.im/fastfall).

Example:

```js
var steed = require('steed')()
// or
// var steed = require('steed')

steed.waterfall([
  function a (cb) {
    console.log('called a')
    cb(null, 'a')
  },
  function b (a, cb) {
    console.log('called b with:', a)
    cb(null, 'a', 'b')
  },
  function c (a, b, cb) {
    console.log('called c with:', a, b)
    cb(null, 'a', 'b', 'c')
  }], function result (err, a, b, c) {
    console.log('result arguments', arguments)
  })

// preferred version for maximum speed
function run (word, cb) {
  steed.waterfall(new State(cb), [
    aT, bT, cT,
  ], cb)
}

// can be optimized by V8 using an hidden class
function State (value) {
  this.value = value
}

// because it is not a closure inside run()
// v8 can optimize this function
function aT (cb) {
  console.log(this.value)
  console.log('called a')
  cb(null, 'a')
}

// because it is not a closure inside run()
// v8 can optimize this function
function bT (a, cb) {
  console.log('called b with:', a)
  cb(null, 'a', 'b')
}

// because it is not a closure inside run()
// v8 can optimize this function
function cT (a, b, cb) {
  console.log('called c with:', a, b)
  cb(null, 'a', 'b', 'c')
}
```

Benchmark for doing 3 calls `setImmediate` 100 thousands times:

* non-reusable setImmediate: 418ms
* `async.waterfall`: 1174ms
* `run-waterfall`: 1432ms
* `insync.wasterfall`: 1174ms
* `neo-async.wasterfall`: 469ms
* `waterfallize`: 749ms
* `fastfall`: 452ms

These benchmarks where taken on node v4.2.2, on a MacBook
Pro Retina Mid 2014 (i7, 16GB of RAM).

-------------------------------------------------------
<a name="each"></a>
### steed.each([that,] array, iterator(item, cb), [, done()])

Iterate over all elements of the given array asynchronosly and in
parallel.
Calls `iterator` with an item and a callback. Calls `done` when all have
been processed.

The `that` argument will set `this` for each task and `done` callback.

`each` does not handle errors, if you need errors, use [`map`](#map).

Uses [fastparallel](http://npm.im/fastparallel).

Example:

```js
var steed = require('steed')()
// or
// var steed = require('steed')

var input = [1, 2, 3]
var factor = 2

steed.each(input, function (num, cb) {
  console.log(num * factor)
  setImmediate(cb)
}, function () {
  console.log('done')
})

// preferred version for max speed
function run (factor, args, cb) {
  steed.each(new State(factor), work, cb)
}

// can be optimizied by V8 using an hidden class
function State (factor) {
  this.factor = factor
}

// because it is not a closure inside run()
// v8 can optimize this function
function work (num, cb) {
  console.log(num * this.factor)
  cb()
}

run(factor, input, console.log)
```

Benchmark for doing 3 calls `setImmediate` 1 million times:

* non-reusable `setImmediate`: 1781ms
* `async.each`: 2621ms
* `neoAsync.each`: 2156ms
* `insync.parallel`: 10252ms
* `insync.each`: 2397ms
* `fastparallel` each: 1941ms

These benchmarks where taken on node v4.2.2, on a MacBook
Pro Retina Mid 2014 (i7, 16GB of RAM).

-------------------------------------------------------
<a name="eachSeries"></a>
### steed.eachSeries([that,] array, iterator(item, cb), [, done(err)])

Iterate over all elements of the given array asynchronously and in
series.
Calls `iterator` with an item and a callback. Calls `done` when all have
been processed.

The `that` argument will set `this` for each task and `done` callback.

`eachSeries` does not handle errors, if you need errors, use [`mapSeries`](#mapSeries).

Uses [fastseries](http://npm.im/fastseries).

Example:

```js
var steed = require('steed')()
// or
// var steed = require('steed')

var input = [1, 2, 3]
var factor = 2

steed.eachSeries(input, function (num, cb) {
  console.log(num * factor)
  setImmediate(cb)
}, function (err) {
  console.log(err)
})

// preferred version for max speed
function run (factor, args, cb) {
  steed.eachSeries(new State(factor), work, cb)
}

// can be optimizied by V8 using an hidden class
function State (factor) {
  this.factor = factor
}

// because it is not a closure inside run()
// v8 can optimize this function
function work (num, cb) {
  console.log(num * this.factor)
  cb()
}

run(factor, input, console.log)
```

Benchmark for doing 3 calls `setImmediate` 1 million times:

* non-reusable `setImmediate`: 3887ms
* `async.mapSeries`: 5540ms
* `neoAsync.eachSeries`: 4195ms
* `fastseries` each: 4168ms

These benchmarks where taken on node v4.2.2, on a MacBook
Pro Retina Mid 2014 (i7, 16GB of RAM).

-------------------------------------------------------
<a name="map"></a>
### steed.map([that,] array, iterator(item, cb), [, done(err, results)])

Performs a map operation over all elements of the given array asynchronously and in
parallel. The result is an a array where all items have been replaced by
the result of `iterator`.

The `that` argument will set `this` for each task and `done` callback.

Calls `iterator` with an item and a callback. Calls `done` when all have
been processed.

Uses [fastparallel](http://npm.im/fastparallel).

Example:

```js
var steed = require('steed')()
// or
// var steed = require('steed')

var input = [1, 2, 3]
var factor = 2

steed.map(input, function (num, cb) {
  setImmediate(cb, null, num * factor)
}, function (err, results) {
  if (err) { throw err }

  console.log(results.reduce(sum))
})

function sum (acc, num) {
  return acc + num
}

// preferred version for max speed
function run (factor, args, cb) {
  steed.map(new State(factor, cb), args, work, done)
}

// can be optimizied by V8 using an hidden class
function State (factor, cb) {
  this.factor = factor
  this.cb = cb
}

// because it is not a closure inside run()
// v8 can optimize this function
function work (num, cb) {
  setImmediate(cb, null, num * this.factor)
}

function done (err, results) {
  results = results || []
  this.cb(err, results.reduce(sum))
}

run(2, [1, 2, 3], console.log)
```

Benchmark for doing 3 calls `setImmediate` 1 million times:

* non-reusable `setImmediate`: 1781ms
* `async.map`: 3054ms
* `neoAsync.map`: 2080ms
* `insync.map`: 9700ms
* `fastparallel` map: 2102ms

These benchmarks where taken on node v4.2.2, on a MacBook
Pro Retina Mid 2014 (i7, 16GB of RAM).

-------------------------------------------------------
<a name="mapSeries"></a>
### steed.mapSeries([that,] array, iterator(item, cb), [, done(err, results)])

Performs a map operation over all elements of the given array asynchronosly and in
series. The result is an a array where all items have been replaced by
the result of `iterator`.

Calls `iterator` with an item and a callback. Calls `done` when all have
been processed.

The `that` argument will set `this` for each task and `done` callback.

Uses [fastseries](http://npm.im/fastseries).

Example:

```js
var steed = require('steed')()
// or
// var steed = require('steed')

var input = [1, 2, 3]
var factor = 2

steed.mapSeries(input, function (num, cb) {
  setImmediate(cb, null, num * factor)
}, function (err, results) {
  if (err) { throw err }

  console.log(results.reduce(sum))
})

function sum (acc, num) {
  return acc + num
}

// preferred version for max speed
function run (factor, args, cb) {
  steed.mapSeries(new State(factor, cb), args, work, done)
}

// can be optimizied by V8 using an hidden class
function State (factor, cb) {
  this.factor = factor
  this.cb = cb
}

// because it is not a closure inside run()
// v8 can optimize this function
function work (num, cb) {
  setImmediate(cb, null, num * this.factor)
}

function done (err, results) {
  results = results || []
  this.cb(err, results.reduce(sum))
}

run(2, [1, 2, 3], console.log)
```

Benchmark for doing 3 calls `setImmediate` 1 million times:

* non-reusable `setImmediate`: 3887ms
* `async.mapSeries`: 5540ms
* `neoAsync.mapSeries`: 4237ms
* `fastseries` map: 4032ms

These benchmarks where taken on node v4.2.2, on a MacBook
Pro Retina Mid 2014 (i7, 16GB of RAM).

-------------------------------------------------------
<a name="queue"></a>
### steed.queue(worker, concurrency)

Creates a new queue. See [fastq](http://npm.im/fastq) for full API.

Arguments:

* `worker`, worker function, it would be called with `that` as `this`,
  if that is specified.
* `concurrency`, number of concurrent tasks that could be executed in
  parallel.

Example:

```js
var steed = require('steed')()
// or
// var steed = require('steed')

var queue = steed.queue(worker, 1)

queue.push(42, function (err, result) {
  if (err) { throw err }
  console.log('the result is', result)
})

function worker (arg, cb) {
  cb(null, arg * 2)
}
```

Benchmarks (1 million tasks):

* setImmedidate: 1313ms
* fastq: 1462ms
* async.queue: 3989ms

Obtained on node 4.2.2, on a MacBook Pro 2014 (i7, 16GB of RAM).

## Caveats

This library works by caching the latest used function, so that running a new parallel
does not cause **any memory allocations**.

The `done` function will be called only once, even if more than one error happen.

__Steed__ has no safety checks: you should be responsible to avoid sync
functions and so on. Also arguments type checks are not included, so be
careful in what you pass.

<a name="why"></a>
## Why it is so fast?

1. This library is caching functions a lot. We invented a technique to
   do so, and packaged it in a module: [reusify](http://npm.im/reusify).

2. V8 optimizations: thanks to caching, the functions can be optimized by V8
   (if they are optimizable, and we took great care of making them so).

3. Don't use arrays if you just need a queue. A linked list implemented via
   objects is much faster if you do not need to access elements in between.

## Acknowledgements

Steed is sponsored by [nearForm](http://nearform.com).

The steed logo was created, with thanks, by [Dean McDonnell](https://github.com/mcdonnelldean)

## License

MIT

[logo-url]: https://raw.githubusercontent.com/mcollina/steed/master/assets/banner.png
[npm-badge]: https://badge.fury.io/js/steed.svg
[npm-url]: https://badge.fury.io/js/steed
[travis-badge]: https://api.travis-ci.org/mcollina/steed.svg
[travis-url]: https://travis-ci.org/mcollina/steed
[coveralls-badge]:https://coveralls.io/repos/mcollina/steed/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/mcollina/steed?branch=master
[david-badge]: https://david-dm.org/mcollina/steed.svg
[david-url]: https://david-dm.org/mcollina/steed
