'use strict'

var test = require('tape')
var reusify = require('./')

test('reuse objects', function (t) {
  t.plan(6)

  function MyObject () {
    t.pass('constructor called')
    this.next = null
  }

  var instance = reusify(MyObject)
  var obj = instance.get()

  t.notEqual(obj, instance.get(), 'two instance created')
  t.notOk(obj.next, 'next must be null')

  instance.release(obj)

  // the internals keeps a hot copy ready for reuse
  // putting this one back in the queue
  instance.release(instance.get())

  // comparing the old one with the one we got
  // never do this in real code, after release you
  // should never reuse that instance
  t.equal(obj, instance.get(), 'instance must be reused')
})
