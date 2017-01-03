[![Build Status](https://travis-ci.org/NodeRedis/node-redis-parser.png?branch=master)](https://travis-ci.org/NodeRedis/node-redis-parser)
[![Code Climate](https://codeclimate.com/github/NodeRedis/node-redis-parser/badges/gpa.svg)](https://codeclimate.com/github/NodeRedis/node-redis-parser)
[![Test Coverage](https://codeclimate.com/github/NodeRedis/node-redis-parser/badges/coverage.svg)](https://codeclimate.com/github/NodeRedis/node-redis-parser/coverage)

# redis-parser

A high performance redis parser solution built for [node_redis](https://github.com/NodeRedis/node_redis) and [ioredis](https://github.com/ioredis/luin).

Generally all [RESP](http://redis.io/topics/protocol) data will be properly parsed by the parser.

## Install

Install with [NPM](https://npmjs.org/):

```
npm install redis-parser
```

## Usage

```js
var Parser = require('redis-parser');

new Parser(options);
```

### Possible options

* `returnReply`: *function*; mandatory
* `returnError`: *function*; mandatory
* `returnFatalError`: *function*; optional, defaults to the returnError function
* `returnBuffers`: *boolean*; optional, defaults to false
* `name`: *'javascript'|'hiredis'|'auto'|null*; optional, defaults to hiredis and falls back to the js parser if not available or if the stringNumbers option is choosen. Setting this to 'auto' or null is going to automatically determine what parser is available and chooses that one.
* `stringNumbers`: *boolean*; optional, defaults to false. This is only available for the javascript parser at the moment!

### Example

```js
var Parser = require("redis-parser");

function Library () {}

Library.prototype.returnReply = function (reply) { ... }
Library.prototype.returnError = function (err) { ... }
Library.prototype.returnFatalError = function (err) { ... }

var lib = new Library();

var parser = new Parser({
    returnReply: function(reply) {
        lib.returnReply(reply);
    },
    returnError: function(err) {
        lib.returnError(err);
    },
    returnFatalError: function (err) {
        lib.returnFatalError(err);
    },
    name: 'auto' // This returns either the hiredis or the js parser instance depending on what's available
});

Library.prototype.streamHandler = function () {
    this.stream.on('data', function (buffer) {
        // Here the data (e.g. `new Buffer('$5\r\nHello\r\n'`)) is passed to the parser and the result is passed to either function depending on the provided data.
        parser.execute(buffer);
    });
};
```
You do not have to use the returnFatalError function. Fatal errors will be returned in the normal error function in that case.

And if you want to return buffers instead of strings, you can do this by adding the `returnBuffers` option.

If you handle big numbers, you should pass the `stringNumbers` option. That case numbers above 2^53 can be handled properly without reduced precision.

```js
// Same functions as in the first example

var parser = new Parser({
    returnReply: function(reply) {
        lib.returnReply(reply);
    },
    returnError: function(err) {
        lib.returnError(err);
    },
    name: 'javascript', // Use the Javascript parser
    stringNumbers: true, // Return all numbers as string instead of a js number
    returnBuffers: true // All strings are returned as buffer e.g. <Buffer 48 65 6c 6c 6f>
});

// The streamHandler as above
```

## Further info

The [hiredis](https://github.com/redis/hiredis) parser is still the fasted parser for
Node.js and therefor used as default in redis-parser if the hiredis parser is available.

Otherwise the pure js NodeRedis parser is choosen that is almost as fast as the
hiredis parser besides some situations in which it'll be a bit slower.

## Protocol errors

To handle protocol errors (this is very unlikely to happen) gracefuly you should add the returnFatalError option, reject any still running command (they might have been processed properly but the reply is just wrong), destroy the socket and reconnect.
Otherwise a chunk might still contain partial data of a following command that was already processed properly but answered in the same chunk as the command that resulted in the protocol error.

## Contribute

The js parser is already optimized but there are likely further optimizations possible.
Besides running the tests you'll also have to run the change at least against the node_redis benchmark suite and post the improvement in the PR.
If you want to write a own parser benchmark, that would also be great!

```
npm install
npm test

# Run node_redis benchmark (let's guess you cloned node_redis in another folder)
cd ../redis
npm install
npm run benchmark parser=javascript > old.log
# Replace the changed parser in the node_modules
npm run benchmark parser=javascript > new.log
node benchmarks/diff_multi_bench_output.js old.log new.log > improvement.log
```

## License

[MIT](./LICENSE)
