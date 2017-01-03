var safeStringify = require('fast-safe-stringify')
function tryStringify (o) {
  try { return JSON.stringify(o) } catch(e) { return '"[Circular]"' }
}
module.exports = function format(args, opts) {
  var ss = (opts && opts.lowres) ? tryStringify : safeStringify
  var f = args[0]
  if (typeof f !== 'string') {
    const objects = new Array(args.length)
    for (var index = 0; index < args.length; index++) {
      objects[index] = ss(args[index])
    }
    return objects.join(' ')
  }

  var argLen = args.length

  if (argLen === 1) return f
  var x = ''
  var str = ''
  var a = 1
  var lastPos = 0
  var flen = f.length
  for (var i = 0; i < flen;) {
    if (f.charCodeAt(i) === 37 && i + 1 < flen) {
      switch (f.charCodeAt(i + 1)) {
        case 100: // 'd'
          if (a >= argLen)
            break
          if (lastPos < i)
            str += f.slice(lastPos, i)
          if (args[a] == null)  break
          str += Number(args[a])
          lastPos = i = i + 2
          break
        case 106: // 'j'
          if (a >= argLen)
            break
          if (lastPos < i)
            str += f.slice(lastPos, i)
          if (args[a] === undefined) break
          x = JSON.stringify(ss(args[a]))
          str += x.substr(1, x.length - 2)
          lastPos = i = i + 2
          break
        case 115: // 's'
          if (a >= argLen)
            break
          if (lastPos < i)
            str += f.slice(lastPos, i)
          x = JSON.stringify(String(args[a]))
          str += x.substr(1, x.length - 2)
          lastPos = i = i + 2
          break
        case 37: // '%'
          if (lastPos < i)
            str += f.slice(lastPos, i)
          str += '%'
          lastPos = i = i + 2
          break
      }
      ++a
    }
    ++i
  }
  if (lastPos === 0)
    str = f
  else if (lastPos < flen) {
    str += f.slice(lastPos)
  }
  while (a < argLen) {
    x = args[a++]
    if (x === null || (typeof x !== 'object')) {
      str += ' ' + x
    } else {
      str += ' ' + ss(x)
    }
  }

  return str
}