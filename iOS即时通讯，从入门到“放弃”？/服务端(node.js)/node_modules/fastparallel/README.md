# fastparallel [![Build Status](https://travis-ci.org/mcollina/fastparallel.svg?branch=master)](https://travis-ci.org/mcollina/fastparallel)

Zero-overhead parallel function call for node.js. Also supports each
and map!

Benchmark for doing 3 calls `setImmediate` 1 million times:

* non-reusable `setImmediate`: 1781ms
* `async.parallel`: 3484ms
* `async.each`: 2621ms
* `async.map`: 3054ms
* `neoAsync.parallel`: 2162ms
* `neoAsync.each`: 2156ms
* `neoAsync.map`: 2080ms
* `insync.parallel`: 10252ms
* `insync.each`: 2397ms
* `insync.map`: 9700ms
* `items.parallel`: 3725ms
* `parallelize`: 2928ms
* `fastparallel` with results: 2139ms
* `fastparallel` without results: 1957ms
* `fastparallel` map: 2102ms
* `fastparallel` each: 1941ms

These benchmarks where taken via `bench.js` on node v4.2.2, on a MacBook
Pro Retina Mid 2014 (i7, 16GB of RAM).

If you need zero-overhead series function call, check out
[fastseries](http://npm.im/fastseries). If you need a fast work queue
check out [fastq](http://npm.im/fastq). If you need to run fast
waterfall calls, use [fastfall](http://npm.im/fastfall).

[![js-standard-style](https://raw.githubusercontent.com/feross/standard/master/badge.png)](https://github.com/feross/standard)

__The major difference between version 1.x.x and 2.x.x is the order of
results__, this is now ready to replace async in every case.

## Example for parallel call

```js
var parallel = require('fastparallel')({
  // this is a function that will be called
  // when a parallel completes
  released: completed,

  // if you want the results, then here you are
  results: true
})

parallel(
  {}, // what will be this in the functions
  [something, something, something], // functions to call
  42, // the first argument of the functions
  done // the function to be called when the parallel ends
)

function something (arg, cb) {
  setImmediate(cb, null, 'myresult')
}

function done (err, results) {
  console.log('parallel completed, results:', results)
}

function completed () {
  console.log('parallel completed!')
}
```

## Example for each and map calls

```js
var parallel = require('fastparallel')({
  // this is a function that will be called
  // when a parallel completes
  released: completed,

  // if you want the results, then here you are
  // passing false disables map
  results: true
})

parallel(
  {}, // what will be this in the functions
  something, // functions to call
  [1, 2, 3], // the first argument of the functions
  done // the function to be called when the parallel ends
)

function something (arg, cb) {
  setImmediate(cb, null, 'myresult')
}

function done (err, results) {
  console.log('parallel completed, results:', results)
}

function completed () {
  console.log('parallel completed!')
}

```

## Caveats

The `done` function will be called only once, even if more than one error happen.

This library works by caching the latest used function, so that running a new parallel
does not cause **any memory allocations**.

## Why it is so fast?

1. This library is caching functions a lot.

2. V8 optimizations: thanks to caching, the functions can be optimized by V8 (if they are optimizable, and I took great care of making them so).

3. Don't use arrays if you just need a queue. A linked list implemented via processes is much faster if you don't need to access elements in between.

4. Accept passing a this for the functions. Thanks to this hack, you can extract your functions, and place them in a outer level where they are not created at every execution.

## License

ISC
