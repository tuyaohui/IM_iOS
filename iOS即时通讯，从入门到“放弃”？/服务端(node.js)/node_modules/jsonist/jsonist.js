var url         = require('url')
  , hyperquest  = require('hyperquest')
  , bl          = require('bl')
  , stringify   = require('json-stringify-safe')
  , xtend       = require('xtend')


function collector (uri, options, callback) {
  var request       = makeRequest(uri, options)
    , redirect      = null
    , redirectCount = 0

  return handle(request)

  function handle (request) {
    if (options.followRedirects) {
      request.on('response', function (response) {
        redirect = isRedirect(request.request, response) && response.headers.location
      })
    }

    request.pipe(bl(function (err, data) {
      if (redirect) {
        if (++redirectCount >= (typeof options.followRedirects == 'number' ? options.followRedirects : 10))
          return callback(new Error('Response was redirected too many times (' + redirectCount + ')'))
        request = makeRequest(url.resolve(uri, redirect), options)
        redirect = null
        return handle(request)
      }

      if (err)
        return callback(err)

      if (!data.length)
        return callback(null, null, request.response)

      var ret

      try {
        ret = JSON.parse(data.toString())
      } catch (e) {
        var err = new SyntaxError('JSON parse error: ' + e.message, e)
        err.data = data
        err.response = request.response
        return callback(err)
      }

      callback(null, ret, request.response)
    }))

    return request
  }
}


function makeMethod (method, data) {
  function handler (uri, options, callback) {
    if (typeof options == 'function') {
      callback = options
      options = {}
    } else
      options = xtend(options, {})

    if (!options.method)
      options.method = method

    if (!options.headers)
      options.headers = {}

    if (data && !options.headers['content-type'])
      options.headers['content-type'] = 'application/json'

    if (!options.headers['accept'])
      options.headers['accept'] = 'application/json'

    return collector(uri, options, callback)
  }

  function dataHandler (uri, data, options, callback) {
    var request = handler(uri, options, callback)
    if (typeof data.pipe == 'function')
      data.pipe(request)
    else
      request.end(stringify(data))
    return request
  }

  return data ? dataHandler : handler
}


function makeRequest (uri, options) {
  return (options.hyperquest || hyperquest)(uri, options)
}


function isRedirect (request, response) {
  return request.method === 'GET' &&
         response.headers.location &&
         (    response.statusCode === 301
           || response.statusCode === 302
           || response.statusCode === 307
           || response.statusCode === 308
         )
}


module.exports.get    = makeMethod('GET'    , false)
module.exports.post   = makeMethod('POST'   , true)
module.exports.put    = makeMethod('PUT'    , true)
module.exports.delete = makeMethod('DELETE' , false)
