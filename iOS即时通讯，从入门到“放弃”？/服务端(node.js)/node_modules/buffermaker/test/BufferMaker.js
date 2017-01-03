require('should');
var BufferMaker = require('../index');

describe("BufferMaker", function(){

  describe("when used for little endian scenarios", function(){
    describe("when used for non integers", function(){
      it ("can create floats", function(){
        var buffer = new Buffer(4);
        buffer.writeFloatLE(0xcafebabe,0);
        var actual = new BufferMaker().FloatLE(0xcafebabe).make();
        actual.should.eql(buffer);
      });
      it ("can create doubles", function(){
        var buffer = new Buffer(8);
        buffer.writeDoubleLE(0xcafebabe,0);
        var actual = new BufferMaker().DoubleLE(0xcafebabe).make();
        actual.should.eql(buffer);
      });
    });
    describe("when used for unsigned integers", function(){
      it("can create a two-byte (16-bit) buffer", function(){
        var buffer = new Buffer(2);
        buffer.writeUInt16LE(5,0);
        var actual = new BufferMaker().UInt16LE(5).make();
        actual.should.eql(buffer);
      });
      it("can create a four-byte (32-bit) buffer", function(){
        var buffer = new Buffer(4);
        buffer.writeUInt32LE(5,0);
        var actual = new BufferMaker().UInt32LE(5).make();
        actual.should.eql(buffer);
      });

    });
    describe("when used for signed integers", function(){
      it("can create a two-byte (16-bit) buffer", function(){
        var buffer = new Buffer(2);
        buffer.writeInt16LE(5,0);
        var actual = new BufferMaker().Int16LE(5).make();
        actual.should.eql(buffer);
      });
      it("can create a four-byte (32-bit) buffer", function(){
        var buffer = new Buffer(4);
        buffer.writeInt32LE(5,0);
        var actual = new BufferMaker().Int32LE(5).make();
        actual.should.eql(buffer);
      });
    });
  });
  describe("when used for big endian scenarios", function(){
    describe("when used for non integers", function(){
      it ("can create floats", function(){
        var buffer = new Buffer(4);
        buffer.writeFloatBE(0xcafebabe,0);
        var actual = new BufferMaker().FloatBE(0xcafebabe).make();
        actual.should.eql(buffer);
      });
      it ("can create doubles", function(){
        var buffer = new Buffer(8);
        buffer.writeDoubleBE(0xcafebabe,0);
        var actual = new BufferMaker().DoubleBE(0xcafebabe).make();
        actual.should.eql(buffer);
      });
    });

    describe("when used for unsigned input", function(){
      it("can create a one byte buffer", function(){
        var buffer = new Buffer(1);
        buffer.writeUInt8(5,0);
        var actual = new BufferMaker().UInt8(5).make();
        actual.should.eql(buffer);
      });
      it("can create a two-byte (16-bit) buffer", function(){
        var buffer = new Buffer(2);
        buffer.writeUInt16BE(5,0);
        var actual = new BufferMaker().UInt16BE(5).make();
        actual.should.eql(buffer);
      });
      it("can create a four-byte (32-bit) buffer", function(){
        var buffer = new Buffer(4);
        buffer.writeUInt32BE(5,0);
        var actual = new BufferMaker().UInt32BE(5).make();
        actual.should.eql(buffer);
      });
      it ("can create a buffer from a binary string", function(){
        var messageSetBufferMaker = new BufferMaker();
        var encodedMessage = new Buffer("four");
        var messageSet = messageSetBufferMaker
                      .UInt32BE(encodedMessage.length)
                      .string(encodedMessage)
                      .make();
        messageSet.should.eql(new Buffer([0, 0, 0, 4, 'f'.charCodeAt(0), 'o'.charCodeAt(0), 'u'.charCodeAt(0), 'r'.charCodeAt(0)]));
      });
    });

    describe("when used for signed input", function(){
      it("can create a one byte buffer", function(){
        var buffer = new Buffer(1);
        buffer.writeInt8(5,0);
       var actual = new BufferMaker().Int8(5).make();
        actual.should.eql(buffer);
      });
      it("can create a two-byte (16-bit) buffer", function(){
        var buffer = new Buffer(2);
        buffer.writeInt16BE(5,0);
        var actual = new BufferMaker().Int16BE(5).make();
        actual.should.eql(buffer);
      });
      it("can create a four-byte (32-bit) buffer", function(){
        var buffer = new Buffer(4);
        buffer.writeInt32BE(5,0);
        var actual = new BufferMaker().Int32BE(5).make();
        actual.should.eql(buffer);
      });
      it("can create an eight-byte (64-bit) buffer", function(){
        var buffer = new Buffer(8);
        buffer.writeInt32BE(0,0);
        buffer.writeInt32BE(5,4);
        var actual = new BufferMaker().Int64BE(5).make();
        actual.should.eql(buffer);
      });
      it("can create an eight-byte (64-bit) buffer from a negative number", function(){
        var actual = new BufferMaker().Int64BE(-1).make();
        var expected = new Buffer(8);
        for(var i = 0; i < 8; i++){
          expected.writeUInt8(255, i);
        }
        actual.should.eql(expected);
      });
      it("can create an eight-byte (64-bit) buffer from a negative number as a string", function(){
        var actual = new BufferMaker().Int64BE('-1').make();
        var expected = new Buffer(8);
        for(var i = 0; i < 8; i++){
          expected.writeUInt8(255, i);
        }
        actual.should.eql(expected);
      });
    });

    it ("can create a buffer from a binary string", function(){
      var messageSetBufferMaker = new BufferMaker();
      var encodedMessage = new Buffer("four");
      var messageSet = messageSetBufferMaker
                    .UInt32BE(encodedMessage.length)
                    .string(encodedMessage)
                    .make();
      messageSet.should.eql(new Buffer([0, 0, 0, 4, 'f'.charCodeAt(0), 'o'.charCodeAt(0), 'u'.charCodeAt(0), 'r'.charCodeAt(0)]));
    });
    // non breaking space ( \u00a0 ) uses two bytes in utf8:
    //       http://en.wikipedia.org/wiki/UTF-8#Description
    it ("can create a buffer from a string with some 2-byte utf8 in it", function(){
      var expected = new Buffer("fo\u00a0ur");
      var actual = new BufferMaker()
                    .string("fo\u00a0ur")
                    .make();
      actual.should.eql(expected);
      actual.toString('utf8').should.equal("fo\u00a0ur");
      actual.length.should.equal(6);
      expected.length.should.equal(6);
    });
    // this was reported as a bug
    it ("can properly report length of chinese strings", function(){
      var str = '中国';
      //console.log("str: ", str);
      var actual = new BufferMaker().string(str).make();
      //console.log("actual: ", actual.toString());

      var expected = new Buffer(str);
      //console.log("expected: ", expected.toString());
      actual.should.eql(expected);
      actual.toString('utf8').should.equal(str);
      actual.length.should.equal(6);
    });
    it("can create a buffer from a string", function(){
      var buffer = new Buffer(8);
      buffer.write("12345678");
      var actual = new BufferMaker().string("12345678").make();
      actual.should.eql(buffer);
    });
    it("can create a buffer from a weird string", function(){
      var buffer = new Buffer(10);
      buffer.write("1234\u00a05678");
      var actual = new BufferMaker().string("1234\u00a05678").make();
      actual.should.eql(buffer);
    });

    it("can create a buffer from a buffer", function(){
      var buffer = new Buffer(8);
      buffer.write("12345678");
      var expected = new BufferMaker().string(buffer).make();
      var actual = new BufferMaker().string("12345678").make();
      actual.should.eql(expected);
    });


  });

});
