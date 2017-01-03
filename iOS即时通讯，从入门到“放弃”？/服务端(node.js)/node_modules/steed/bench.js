var max = 1000000
var steed = require('./')
var bench = require('fastbench')
var neo = require('neo-async')
var funcs = [somethingA, somethingA, somethingA]

function benchSteedParallel (done) {
  steed.parallel(funcs, done)
}

function benchNeoParallel (done) {
  neo.parallel(funcs, done)
}

var nextDone
var nextCount

function benchSetImmediate (done) {
  nextCount = 3
  nextDone = done
  setImmediate(somethingImmediate)
  setImmediate(somethingImmediate)
  setImmediate(somethingImmediate)
}

function somethingImmediate () {
  nextCount--
  if (nextCount === 0) {
    nextDone()
  }
}

function somethingA (cb) {
  setImmediate(cb)
}

var run = bench([
  benchSetImmediate,
  benchNeoParallel,
  benchSteedParallel
], max)

run(run)
