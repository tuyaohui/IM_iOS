'use strict'

var test = require('tape')
var factory = require('./')

function buildTest (steed) {
  test('each', function (t) {
    t.plan(9)

    var input = [1, 2, 3]
    var i = 0

    steed.each(input, function (num, cb) {
      t.equal(0, i, 'calls in parallel')
      setImmediate(function () {
        var res = input[i++]
        t.equal(res, num)
        cb(null, res * 2)
      })
    }, function (err, snd) {
      t.error(err, 'no error')
      t.notOk(snd, 'no second argument')
      t.equal(3, i, 'iterated over all inputs')
    })
  })

  test('each with this', function (t) {
    t.plan(13)

    var input = [1, 2, 3]
    var i = 0
    var obj = {}

    steed.each(obj, input, function (num, cb) {
      t.equal(0, i, 'calls in parallel')
      t.equal(obj, this, 'this is set')
      setImmediate(function () {
        var res = input[i++]
        t.equal(res, num)
        cb(null, res * 2)
      })
    }, function (err, snd) {
      t.equal(obj, this, 'this is set')
      t.error(err, 'no error')
      t.notOk(snd, 'no second argument')
      t.equal(3, i, 'iterated over all inputs')
    })
  })

  test('each with this without a done callback', function (t) {
    t.plan(9)

    var input = [1, 2, 3]
    var i = 0
    var obj = {}

    steed.each(obj, input, function (num, cb) {
      t.equal(0, i, 'calls in parallel')
      t.equal(obj, this, 'this is set')
      setImmediate(function () {
        var res = input[i++]
        t.equal(res, num)
        cb(null, res * 2)
      })
    })
  })

  test('each without a done callback', function (t) {
    t.plan(6)

    var input = [1, 2, 3]
    var i = 0

    steed.each(input, function (num, cb) {
      t.equal(0, i, 'calls in parallel')
      setImmediate(function () {
        var res = input[i++]
        t.equal(res, num)
        cb(null, res * 2)
      })
    })
  })

  test('map', function (t) {
    t.plan(9)

    var input = [1, 2, 3]
    var i = 0

    steed.map(input, function (num, cb) {
      t.equal(0, i, 'calls in parallel')
      setImmediate(function () {
        var res = input[i++]
        t.equal(res, num)
        cb(null, res * 2)
      })
    }, function (err, snd) {
      t.error(err, 'no error')
      t.deepEqual([2, 4, 6], snd, 'second args contains the map')
      t.equal(3, i, 'iterated over all inputs')
    })
  })

  test('map with this', function (t) {
    t.plan(13)

    var input = [1, 2, 3]
    var i = 0
    var obj = {}

    steed.map(obj, input, function (num, cb) {
      t.equal(0, i, 'calls in parallel')
      t.equal(obj, this, 'this is set')
      setImmediate(function () {
        var res = input[i++]
        t.equal(res, num)
        cb(null, res * 2)
      })
    }, function (err, snd) {
      t.error(err, 'no error')
      t.equal(obj, this, 'this is set')
      t.deepEqual([2, 4, 6], snd, 'second args contains the map')
      t.equal(3, i, 'iterated over all inputs')
    })
  })

  test('map with this without a done callback', function (t) {
    t.plan(9)

    var input = [1, 2, 3]
    var i = 0
    var obj = {}

    steed.map(obj, input, function (num, cb) {
      t.equal(0, i, 'calls in parallel')
      t.equal(obj, this, 'this is set')
      setImmediate(function () {
        var res = input[i++]
        t.equal(res, num)
        cb(null, res * 2)
      })
    })
  })

  test('map without a done callback', function (t) {
    t.plan(6)

    var input = [1, 2, 3]
    var i = 0

    steed.map(input, function (num, cb) {
      t.equal(0, i, 'calls in parallel')
      setImmediate(function () {
        var res = input[i++]
        t.equal(res, num)
        cb(null, res * 2)
      })
    })
  })

  test('eachSeries', function (t) {
    t.plan(9)

    var input = [1, 2, 3]
    var i = 0
    var count = 0

    steed.eachSeries(input, function (num, cb) {
      t.equal(count++, i, 'calls in series')
      setImmediate(function () {
        t.equal(input[i++], num)
        cb(null, input[i] * 2)
      })
    }, function (err, snd) {
      t.error(err, 'no error')
      t.notOk(snd, 'no second argument')
      t.equal(3, i, 'iterated over all inputs')
    })
  })

  test('eachSeries with this', function (t) {
    t.plan(13)

    var input = [1, 2, 3]
    var i = 0
    var count = 0
    var obj = {}

    steed.eachSeries(obj, input, function (num, cb) {
      t.equal(obj, this, 'this is set')
      t.equal(count++, i, 'calls in series')
      setImmediate(function () {
        t.equal(input[i++], num)
        cb(null, input[i] * 2)
      })
    }, function (err, snd) {
      t.error(err, 'no error')
      t.notOk(snd, 'no second argument')
      t.equal(obj, this, 'this is set')
      t.equal(3, i, 'iterated over all inputs')
    })
  })

  test('eachSeries with this without a done callback', function (t) {
    t.plan(9)

    var input = [1, 2, 3]
    var i = 0
    var count = 0
    var obj = {}

    steed.eachSeries(obj, input, function (num, cb) {
      t.equal(obj, this, 'this is set')
      t.equal(count++, i, 'calls in series')
      setImmediate(function () {
        t.equal(input[i++], num)
        cb(null, input[i] * 2)
      })
    })
  })

  test('eachSeries without a done callback', function (t) {
    t.plan(6)

    var input = [1, 2, 3]
    var i = 0
    var count = 0

    steed.eachSeries(input, function (num, cb) {
      t.equal(count++, i, 'calls in series')
      setImmediate(function () {
        t.equal(input[i++], num)
        cb(null, input[i] * 2)
      })
    })
  })

  test('mapSeries', function (t) {
    t.plan(9)

    var input = [1, 2, 3]
    var i = 0
    var count = 0

    steed.mapSeries(input, function (num, cb) {
      t.equal(count++, i, 'calls in series')
      setImmediate(function () {
        var res = input[i++]
        t.equal(res, num)
        cb(null, res * 2)
      })
    }, function (err, snd) {
      t.error(err, 'no error')
      t.deepEqual([2, 4, 6], snd, 'second args contains the map')
      t.equal(3, i, 'iterated over all inputs')
    })
  })

  test('mapSeries with this', function (t) {
    t.plan(13)

    var input = [1, 2, 3]
    var i = 0
    var count = 0
    var obj = {}

    steed.mapSeries(obj, input, function (num, cb) {
      t.equal(count++, i, 'calls in series')
      t.equal(obj, this, 'this is set')
      setImmediate(function () {
        var res = input[i++]
        t.equal(res, num)
        cb(null, res * 2)
      })
    }, function (err, snd) {
      t.error(err, 'no error')
      t.deepEqual([2, 4, 6], snd, 'second args contains the map')
      t.equal(obj, this, 'this is set')
      t.equal(3, i, 'iterated over all inputs')
    })
  })

  test('mapSeries with this without a done callback', function (t) {
    t.plan(9)

    var input = [1, 2, 3]
    var i = 0
    var count = 0
    var obj = {}

    steed.mapSeries(obj, input, function (num, cb) {
      t.equal(count++, i, 'calls in series')
      t.equal(obj, this, 'this is set')
      setImmediate(function () {
        var res = input[i++]
        t.equal(res, num)
        cb(null, res * 2)
      })
    })
  })

  test('mapSeries without a done callback', function (t) {
    t.plan(6)

    var input = [1, 2, 3]
    var i = 0
    var count = 0

    steed.mapSeries(input, function (num, cb) {
      t.equal(count++, i, 'calls in series')
      setImmediate(function () {
        var res = input[i++]
        t.equal(res, num)
        cb(null, res * 2)
      })
    })
  })

  test('parallel', function (t) {
    t.plan(6)

    var input = [1, 2, 3]
    var i = 0

    function myfunc (cb) {
      t.equal(0, i, 'calls in parallel')
      setImmediate(function () {
        var res = input[i++]
        cb(null, res * 2)
      })
    }

    steed.parallel([myfunc, myfunc, myfunc], function (err, snd) {
      t.error(err, 'no error')
      t.deepEqual([2, 4, 6], snd, 'second args contains the map')
      t.equal(3, i, 'iterated over all inputs')
    })
  })

  test('parallel with this', function (t) {
    t.plan(10)

    var input = [1, 2, 3]
    var i = 0
    var obj = {}

    function myfunc (cb) {
      t.equal(0, i, 'calls in parallel')
      t.equal(obj, this, 'this is set')
      setImmediate(function () {
        var res = input[i++]
        cb(null, res * 2)
      })
    }

    steed.parallel(obj, [myfunc, myfunc, myfunc], function (err, snd) {
      t.error(err, 'no error')
      t.equal(obj, this, 'this is set')
      t.deepEqual([2, 4, 6], snd, 'second args contains the map')
      t.equal(3, i, 'iterated over all inputs')
    })
  })

  test('parallel with this without a done callback', function (t) {
    t.plan(6)

    var input = [1, 2, 3]
    var i = 0
    var obj = {}

    function myfunc (cb) {
      t.equal(0, i, 'calls in parallel')
      t.equal(obj, this, 'this is set')
      setImmediate(function () {
        var res = input[i++]
        cb(null, res * 2)
      })
    }

    steed.parallel(obj, [myfunc, myfunc, myfunc])
  })

  test('parallel without a done callback', function (t) {
    t.plan(3)

    var input = [1, 2, 3]
    var i = 0

    function myfunc (cb) {
      t.equal(0, i, 'calls in parallel')
      setImmediate(function () {
        var res = input[i++]
        cb(null, res * 2)
      })
    }

    steed.parallel([myfunc, myfunc, myfunc])
  })

  test('parallel with an object', function (t) {
    t.plan(6)

    var input = [1, 2, 3]
    var i = 0

    function myfunc (cb) {
      t.equal(0, i, 'calls in parallel')
      setImmediate(function () {
        var res = input[i++]
        cb(null, res * 2)
      })
    }

    steed.parallel({
      a: myfunc,
      b: myfunc,
      c: myfunc
    }, function (err, snd) {
      t.error(err, 'no error')
      t.deepEqual({
        a: 2,
        b: 4,
        c: 6
      }, snd, 'second args contains the map')
      t.equal(3, i, 'iterated over all inputs')
    })
  })

  test('series', function (t) {
    t.plan(6)

    var input = [1, 2, 3]
    var i = 0
    var count = 0

    function myfunc (cb) {
      t.equal(count++, i, 'calls in series')
      setImmediate(function () {
        var res = input[i++]
        cb(null, res * 2)
      })
    }

    steed.series([myfunc, myfunc, myfunc], function (err, snd) {
      t.error(err, 'no error')
      t.deepEqual([2, 4, 6], snd, 'second args contains the map')
      t.equal(3, i, 'iterated over all inputs')
    })
  })

  test('series with this', function (t) {
    t.plan(10)

    var input = [1, 2, 3]
    var i = 0
    var count = 0
    var obj = {}

    function myfunc (cb) {
      t.equal(count++, i, 'calls in series')
      t.equal(obj, this, 'this is set')
      setImmediate(function () {
        var res = input[i++]
        cb(null, res * 2)
      })
    }

    steed.series(obj, [myfunc, myfunc, myfunc], function (err, snd) {
      t.error(err, 'no error')
      t.equal(obj, this, 'this is set')
      t.deepEqual([2, 4, 6], snd, 'second args contains the map')
      t.equal(3, i, 'iterated over all inputs')
    })
  })

  test('series with this without a done callback', function (t) {
    t.plan(6)

    var input = [1, 2, 3]
    var i = 0
    var count = 0
    var obj = {}

    function myfunc (cb) {
      t.equal(count++, i, 'calls in series')
      t.equal(obj, this, 'this is set')
      setImmediate(function () {
        var res = input[i++]
        cb(null, res * 2)
      })
    }

    steed.series(obj, [myfunc, myfunc, myfunc])
  })

  test('series without a done callback', function (t) {
    t.plan(3)

    var input = [1, 2, 3]
    var i = 0
    var count = 0

    function myfunc (cb) {
      t.equal(count++, i, 'calls in series')
      setImmediate(function () {
        var res = input[i++]
        cb(null, res * 2)
      })
    }

    steed.series([myfunc, myfunc, myfunc])
  })

  test('series with an object', function (t) {
    t.plan(6)

    var input = [1, 2, 3]
    var i = 0
    var count = 0

    function myfunc (cb) {
      t.equal(count++, i, 'calls in series')
      setImmediate(function () {
        var res = input[i++]
        cb(null, res * 2)
      })
    }

    steed.series({
      a: myfunc,
      b: myfunc,
      c: myfunc
    }, function (err, snd) {
      t.error(err, 'no error')
      t.deepEqual({
        a: 2,
        b: 4,
        c: 6
      }, snd, 'second args contains the map')
      t.equal(3, i, 'iterated over all inputs')
    })
  })

  test('waterfall', function (t) {
    t.plan(4)

    steed.waterfall([ function a (cb) {
      cb(null, [1])
    }, function b (arg, cb) {
      t.deepEqual([1], arg, 'arg for b is right')
      arg.push(2)
      cb(null, arg)
    }, function c (arg, cb) {
      t.deepEqual([1, 2], arg, 'arg for c is right')
      arg.push(3)
      cb(null, arg)
    }], function (err, snd) {
      t.error(err, 'no error')
      t.deepEqual([1, 2, 3], snd, 'second args contains the last result')
    })
  })

  test('queue', function (t) {
    t.plan(4)

    steed.waterfall([ function a (cb) {
      cb(null, [1])
    }, function b (arg, cb) {
      t.deepEqual([1], arg, 'arg for b is right')
      arg.push(2)
      cb(null, arg)
    }, function c (arg, cb) {
      t.deepEqual([1, 2], arg, 'arg for c is right')
      arg.push(3)
      cb(null, arg)
    }], function (err, snd) {
      t.error(err, 'no error')
      t.deepEqual([1, 2, 3], snd, 'second args contains the last result')
    })
  })
}

buildTest(factory)
buildTest(factory())
