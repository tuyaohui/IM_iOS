var pull = require('pull-stream')
var pushable = require('../')
var test = require('tape')

test('pushable', function (t) {
  var buf = pushable()

  // should be a read function!

  t.equal('function', typeof buf)
  t.equal(2, buf.length)

  pull(
    buf,
    pull.collect(function (end, array) {
      console.log(array)
      t.deepEqual(array, [1, 2, 3])
      t.end()
    })
  )

  // SOMETIMES YOU NEED PUSH!

  buf.push(1)
  buf.push(2)
  buf.push(3)
  buf.end()
})
