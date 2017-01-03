'use strict'

var xtend = require('xtend')
var reusify = require('reusify')
var defaults = {
  released: nop,
  results: true
}

function fastseries (options) {
  options = xtend(defaults, options)

  var released = options.released
  var queue = reusify(options.results ? ResultsHolder : NoResultsHolder)

  return series

  function series (that, toCall, arg, done) {
    var holder = queue.get()
    holder._released = release

    done = done || nop

    if (toCall.length === 0) {
      done.call(that)
      release(holder)
    } else {
      holder._callback = done

      if (toCall.call) {
        holder._list = arg
        holder._each = toCall
      } else {
        holder._list = toCall
        holder._arg = arg
      }

      holder._callThat = that
      holder.release()
    }
  }

  function release (holder) {
    queue.release(holder)
    released()
  }
}

function reset () {
  this._list = null
  this._arg = null
  this._callThat = null
  this._callback = nop
  this._each = null
}

function NoResultsHolder () {
  reset.call(this)
  this.next = null
  this._released = null

  var that = this
  var i = 0
  this.release = function () {
    if (i < that._list.length) {
      if (that._each) {
        makeCall(that._callThat, that._each, that._list[i++], that.release)
      } else {
        makeCall(that._callThat, that._list[i++], that._arg, that.release)
      }
    } else {
      that._callback.call(that._callThat)
      reset.call(that)
      i = 0
      that._released(that)
    }
  }
}

function ResultsHolder (_release) {
  reset.call(this)

  this._results = []
  this.next = null
  this._released = null

  var that = this
  var i = 0
  this.release = function (err, result) {
    if (i !== 0) that._results[i - 1] = result

    if (!err && i < that._list.length) {
      if (that._each) {
        makeCall(that._callThat, that._each, that._list[i++], that.release)
      } else {
        makeCall(that._callThat, that._list[i++], that._arg, that.release)
      }
    } else {
      that._callback.call(that._callThat, err, that._results)
      reset.call(that)
      that._results = []
      i = 0
      that._released(that)
    }
  }
}

function makeCall (that, cb, arg, release) {
  if (that) {
    if (cb.length === 1) {
      cb.call(that, release)
    } else {
      cb.call(that, arg, release)
    }
  } else {
    if (cb.length === 1) {
      cb(release)
    } else {
      cb(arg, release)
    }
  }
}

function nop () { }

module.exports = fastseries
