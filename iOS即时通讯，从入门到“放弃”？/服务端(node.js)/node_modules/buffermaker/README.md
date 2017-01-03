BufferMaker
===========
[![Build Status](https://secure.travis-ci.org/cainus/BufferMaker.png?branch=master)](http://travis-ci.org/cainus/BufferMaker)
[![Coverage Status](https://coveralls.io/repos/cainus/BufferMaker/badge.png?branch=master)](https://coveralls.io/r/cainus/BufferMaker)
[![NPM version](https://badge.fury.io/js/buffermaker.png)](http://badge.fury.io/js/buffermaker)

A convenient way of creating binary strings in node.js because Buffer is a bit too low-level for comfort in this regard.  

Examples:  

```javascript
// unsigned varieties
var someBuffer = new BufferMaker()
                        .UInt8(1)
                        .UInt16BE(2)
                        .UInt32BE(3)
                        .Int64BE(4)     // uses the BigNum library
                        .string("this is a test!")
                        .make();
//  <Buffer 01 00 02 00 00 00 03 00 00 00 00 00 00 00 04 74 68 69 73 20 69 73 20 61 20 74 65 73 74 21>

// signed are also supported:
var someBuffer = new BufferMaker()
                        .Int8(1)
                        .Int16BE(2)
                        .Int32BE(3)
                        .Int64BE(4)
                        .make();
// <Buffer 01 00 02 00 00 00 03 00 00 00 00 00 00 00 04> 

// others...
var someBuffer = new BufferMaker()
                    .UInt16LE(1)
                    .UInt32LE(2)
                    .Int16LE(3)
                    .Int32LE(4)
                    .FloatLE(5)
                    .FloatBE(6)
                    .DoubleLE(7)
                    .DoubleBE(8)
                    .make();
// <Buffer 01 00 02 00 00 00 03 00 04 00 00 00 00 00 a0 40 40 c0 00 00 00 00 00 00 00 00 1c 40 40 20 00 00 00 00 00 00>
```
