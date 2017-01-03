'use strict'

var nr = { results: false }
var fastparallel = require('fastparallel')
var fastseries = require('fastseries')
var fastfall = require('fastfall')
var fastq = require('fastq')

function steed (context) {
  if (!context) {
    context = {}
  }

  var _parNr = fastparallel(nr)
  var _serNr = fastseries(nr)
  var _par = fastparallel()
  var _ser = fastseries()

  context.each = each
  context.map = map
  context.eachSeries = eachSeries
  context.mapSeries = mapSeries
  context.parallel = parallel
  context.series = series
  context.waterfall = fastfall()
  context.queue = fastq

  return context

  function each (that, array, func, cb) {
    if (!func || typeof func === 'function' && typeof array === 'function') {
      cb = func
      func = array
      array = that
      that = null
    }
    _parNr(that, func, array, cb)
  }

  function eachSeries (that, array, func, cb) {
    if (!func || typeof func === 'function' && typeof array === 'function') {
      cb = func
      func = array
      array = that
      that = null
    }
    _serNr(that, func, array, cb)
  }

  function map (that, array, func, cb) {
    if (!func || typeof func === 'function' && typeof array === 'function') {
      cb = func
      func = array
      array = that
      that = null
    }
    _par(that, func, array, cb)
  }

  function mapSeries (that, array, func, cb) {
    if (!func || typeof func === 'function' && typeof array === 'function') {
      cb = func
      func = array
      array = that
      that = null
    }
    _ser(that, func, array, cb)
  }

  function parallel (that, funcs, cb) {
    if (!funcs || typeof funcs === 'function') {
      cb = funcs
      funcs = that
      that = null
    }
    if (Array.isArray(funcs)) {
      _par(that, funcs, null, cb)
    } else {
      _handleObjectMap(that, _par, funcs, cb)
    }
  }

  function series (that, funcs, cb) {
    if (!funcs || typeof funcs === 'function') {
      cb = funcs
      funcs = that
      that = null
    }
    if (Array.isArray(funcs)) {
      _ser(that, funcs, null, cb)
    } else {
      _handleObjectMap(that, _ser, funcs, cb)
    }
  }
}

function _handleObjectMap (that, iterator, funcs, cb) {
  var keys = Object.keys(funcs)
  iterator(new MapStatus(keys, funcs, cb), callNamedFunc, keys, mapResults)
}

function MapStatus (keys, funcs, cb) {
  this.cb = cb
  this.keys = keys
  this.funcs = funcs
  this.results = {}
}

function callNamedFunc (key, cb) {
  this.funcs[key](cb)
}

function mapResults (err, results) {
  if (err) { return this.cb(err) }

  var keys = this.keys
  var toReturn = {}

  for (var i = 0; i < keys.length; i++) {
    toReturn[keys[i]] = results[i]
  }

  this.cb(null, toReturn)
}

module.exports = steed(steed)
