
var mqtt    = require('./')
  , crypto  = require('crypto')
  , max     = 100000
  , i
  , start   = Date.now() / 1000
  , time
  , errors  = 0


function doParse () {
  var parser  = mqtt.parser()
  parser.on('error', onError)
  parser.parse(crypto.randomBytes(Math.floor(Math.random() * 10)))
}

for (i = 0; i < max; i++) {
  doParse()
}

function onError () {
  errors++
}

time = Date.now() / 1000 - start
console.log('Total time', Math.round(time * 100) / 100)
console.log('Errors/s', errors / time)
