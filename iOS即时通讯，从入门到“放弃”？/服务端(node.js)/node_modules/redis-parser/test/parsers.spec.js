'use strict';

var intercept = require('intercept-stdout');
var assert = require('assert');
var Parser = require('../');
var parsers = ['javascript', 'hiredis'];

// Mock the not needed return functions
function returnReply () { throw new Error('failed'); }
function returnError () { throw new Error('failed'); }
function returnFatalError () { throw new Error('failed'); }

describe('parsers', function () {

    describe('general parser functionality', function () {

        it('use default values', function () {
            var parser = new Parser({
                returnReply: returnReply,
                returnError: returnError
            });
            assert.strictEqual(parser.returnError, parser.returnFatalError);
            assert.strictEqual(parser.name, 'hiredis');
        });

        it('auto parser', function () {
            var parser = new Parser({
                returnReply: returnReply,
                returnError: returnError,
                name: 'auto'
            });
            assert.strictEqual(parser.name, 'hiredis');
        });

        it('auto parser v2', function () {
            var parser = new Parser({
                returnReply: returnReply,
                returnError: returnError,
                name: null
            });
            assert.strictEqual(parser.name, 'hiredis');
        });

        it('fail for missing options', function () {
            assert.throws(function() {
                new Parser({
                    returnReply: returnReply,
                    returnBuffers: true
                });
            }, function (err) {
                assert.strictEqual(err.message, 'Please provide all return functions while initiating the parser');
                return true;
            });

        });

        it('unknown parser', function () {
            var str = '';
            var unhookIntercept = intercept(function (data) {
                str += data;
                return '';
            });
            var parser = new Parser({
                returnReply: returnReply,
                returnError: returnError,
                name: 'something_unknown'
            });
            unhookIntercept();
            assert.strictEqual(parser.name, 'hiredis');
            assert(/^Warning: The requested parser "something_unknown" is unkown and the default parser is choosen instead\.\n +at new Parser/.test(str), str);
        });

        it('hiredis and stringNumbers', function () {
            var str = '';
            var unhookIntercept = intercept(function (data) {
                str += data;
                return '';
            });
            var parser = new Parser({
                returnReply: returnReply,
                returnError: returnError,
                name: 'hiredis',
                stringNumbers: true
            });
            unhookIntercept();
            assert.strictEqual(parser.name, 'javascript');
            assert(/^Warning: You explicitly required the hiredis parser in combination with the stringNumbers option. .+.\.\n +at new Parser/.test(str), str);
        });

    });

    parsers.forEach(function (parserName) {

        describe(parserName, function () {

            it('handles multi-bulk reply and check context binding', function () {
                var replyCount = 0;
                function Abc () {}
                Abc.prototype.checkReply = function (reply) {
                    assert.strictEqual(typeof this.log, 'function');
                    assert.deepEqual(reply, [['a']], 'Expecting multi-bulk reply of [["a"]]');
                    replyCount++;
                };
                Abc.prototype.log = console.log;
                var test = new Abc();
                var parser = new Parser({
                    returnReply: function (reply) {
                        test.checkReply(reply);
                    },
                    returnError: returnError,
                    returnFatalError: returnFatalError,
                    name: parserName
                });

                parser.execute(new Buffer('*1\r\n*1\r\n$1\r\na\r\n'));
                assert.strictEqual(replyCount, 1);

                parser.execute(new Buffer('*1\r\n*1\r'));
                parser.execute(new Buffer('\n$1\r\na\r\n'));
                assert.strictEqual(replyCount, 2);

                parser.execute(new Buffer('*1\r\n*1\r\n'));
                parser.execute(new Buffer('$1\r\na\r\n'));

                assert.equal(replyCount, 3, 'check reply should have been called three times');
            });

            it('parser error', function () {
                var replyCount = 0;
                function Abc () {}
                Abc.prototype.checkReply = function (reply) {
                    assert.strictEqual(typeof this.log, 'function');
                    assert.strictEqual(reply.message, 'Protocol error, got "a" as reply type byte');
                    replyCount++;
                };
                Abc.prototype.log = console.log;
                var test = new Abc();
                var parser = new Parser({
                    returnReply: returnReply,
                    returnError: returnError,
                    returnFatalError: function (err) {
                        test.checkReply(err);
                    },
                    name: parserName
                });

                parser.execute(new Buffer('a*1\r*1\r$1`zasd\r\na'));
                assert.equal(replyCount, 1);
            });

            it('parser error resets the buffer', function () {
                var replyCount = 0;
                var errCount = 0;
                function checkReply (reply) {
                    assert.strictEqual(reply.length, 1);
                    assert(Buffer.isBuffer(reply[0]));
                    assert.strictEqual(reply[0].toString(), 'CCC');
                    replyCount++;
                }
                function checkError (err) {
                    assert.strictEqual(err.message, 'Protocol error, got "b" as reply type byte');
                    errCount++;
                }
                var parser = new Parser({
                    returnReply: checkReply,
                    returnError: returnError,
                    returnFatalError: checkError,
                    name: parserName,
                    returnBuffers: true
                });

                // The chunk contains valid data after the protocol error
                parser.execute(new Buffer('*1\r\n+CCC\r\nb$1\r\nz\r\n+abc\r\n'));
                assert.strictEqual(replyCount, 1);
                assert.strictEqual(errCount, 1);
                parser.execute(new Buffer('*1\r\n+CCC\r\n'));
                assert.strictEqual(replyCount, 2);
            });

            it('parser error v3 without returnFatalError specified', function () {
                var replyCount = 0;
                var errCount = 0;
                function checkReply (reply) {
                    assert.strictEqual(reply[0], 'OK');
                    replyCount++;
                }
                function checkError (err) {
                    assert.strictEqual(err.message, 'Protocol error, got "\\n" as reply type byte');
                    errCount++;
                }
                var parser = new Parser({
                    returnReply: checkReply,
                    returnError: checkError,
                    name: parserName
                });

                parser.execute(new Buffer('*1\r\n+OK\r\n\n+zasd\r\n'));
                assert.strictEqual(replyCount, 1);
                assert.strictEqual(errCount, 1);
            });

            it('should handle \\r and \\n characters properly', function () {
                // If a string contains \r or \n characters it will always be send as a bulk string
                var replyCount = 0;
                var entries = ['foo\r', 'foo\r\nbar', '\r\nfoo', 'foo\r\n'];
                function checkReply (reply) {
                    assert.strictEqual(reply, entries[replyCount]);
                    replyCount++;
                }
                var parser = new Parser({
                    returnReply: checkReply,
                    returnError: returnError,
                    returnFatalError: returnFatalError,
                    name: parserName
                });

                parser.execute(new Buffer('$4\r\nfoo\r\r\n$8\r\nfoo\r\nbar\r\n$5\r\n\r\n'));
                assert.strictEqual(replyCount, 2);
                parser.execute(new Buffer('foo\r\n$5\r\nfoo\r\n\r\n'));
                assert.strictEqual(replyCount, 4);
            });

            it('line breaks in the beginning of the last chunk', function () {
                var replyCount = 0;
                function checkReply(reply) {
                    assert.deepEqual(reply, [['a']], 'Expecting multi-bulk reply of [["a"]]');
                    replyCount++;
                }
                var parser = new Parser({
                    returnReply: checkReply,
                    returnError: returnError,
                    returnFatalError: returnFatalError,
                    name: parserName
                });

                parser.execute(new Buffer('*1\r\n*1\r\n$1\r\na'));
                assert.equal(replyCount, 0);

                parser.execute(new Buffer('\r\n*1\r\n*1\r'));
                assert.equal(replyCount, 1);
                parser.execute(new Buffer('\n$1\r\na\r\n*1\r\n*1\r\n$1\r\na\r\n'));

                assert.equal(replyCount, 3, 'check reply should have been called three times');
            });

            it('multiple chunks in a bulk string', function () {
                var replyCount = 0;
                function checkReply(reply) {
                    assert.strictEqual(reply, 'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghij');
                    replyCount++;
                }
                var parser = new Parser({
                    returnReply: checkReply,
                    returnError: returnError,
                    returnFatalError: returnFatalError,
                    name: parserName
                });

                parser.execute(new Buffer('$100\r\nabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij'));
                assert.strictEqual(replyCount, 0);
                parser.execute(new Buffer('\r\n'));
                assert.strictEqual(replyCount, 1);

                parser.execute(new Buffer('$100\r'));
                parser.execute(new Buffer('\nabcdefghijabcdefghijabcdefghijabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghij'));
                assert.strictEqual(replyCount, 1);
                parser.execute(new Buffer(
                    'abcdefghij\r\n' +
                    '$100\r\nabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghij\r\n' +
                    '$100\r\nabcdefghijabcdefghijabcdefghijabcdefghij'
                ));
                assert.strictEqual(replyCount, 3);
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij\r'));
                assert.strictEqual(replyCount, 3);
                parser.execute(new Buffer('\n'));

                assert.equal(replyCount, 4, 'check reply should have been called three times');
            });

            it('multiple chunks with arrays different types', function () {
                var replyCount = 0;
                var predefined_data = [
                    'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghij',
                    'test',
                    100,
                    new Error('Error message'),
                    ['The force awakens']
                ];
                function checkReply(reply) {
                    for (var i = 0; i < reply.length; i++) {
                        if (i < 3) {
                            assert.strictEqual(reply[i], predefined_data[i]);
                        } else {
                            assert.deepEqual(reply[i], predefined_data[i]);
                        }
                    }
                    replyCount++;
                }
                var parser = new Parser({
                    returnReply: checkReply,
                    returnError: returnError,
                    returnFatalError: returnFatalError,
                    name: parserName,
                    returnBuffers: false
                });

                parser.execute(new Buffer('*5\r\n$100\r\nabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij\r\n'));
                parser.execute(new Buffer('+test\r'));
                parser.execute(new Buffer('\n:100'));
                parser.execute(new Buffer('\r\n-Error message'));
                parser.execute(new Buffer('\r\n*1\r\n$17\r\nThe force'));
                assert.strictEqual(replyCount, 0);
                parser.execute(new Buffer(' awakens\r\n$5'));
                assert.strictEqual(replyCount, 1);
            });

            it('return normal errors', function () {
                var replyCount = 0;
                function checkReply(reply) {
                    assert.equal(reply.message, 'Error message');
                    replyCount++;
                }
                var parser = new Parser({
                    returnReply: returnError,
                    returnError: checkReply,
                    returnFatalError: returnFatalError,
                    name: parserName
                });

                parser.execute(new Buffer('-Error '));
                parser.execute(new Buffer('message\r\n*3\r\n$17\r\nThe force'));
                assert.strictEqual(replyCount, 1);
                parser.execute(new Buffer(' awakens\r\n$5'));
                assert.strictEqual(replyCount, 1);
            });

            it('return null for empty arrays and empty bulk strings', function () {
                var replyCount = 0;
                function checkReply(reply) {
                    assert.equal(reply, null);
                    replyCount++;
                }
                var parser = new Parser({
                    returnReply: checkReply,
                    returnError: returnError,
                    returnFatalError: returnFatalError,
                    name: parserName
                });

                parser.execute(new Buffer('$-1\r\n*-'));
                assert.strictEqual(replyCount, 1);
                parser.execute(new Buffer('1'));
                assert.strictEqual(replyCount, 1);
                parser.execute(new Buffer('\r\n$-'));
                assert.strictEqual(replyCount, 2);
            });

            it('return value even if all chunks are only 1 character long', function () {
                var replyCount = 0;
                function checkReply(reply) {
                    assert.equal(reply, 1);
                    replyCount++;
                }
                var parser = new Parser({
                    returnReply: checkReply,
                    returnError: returnError,
                    returnFatalError: returnFatalError,
                    name: parserName
                });

                parser.execute(new Buffer(':'));
                assert.strictEqual(replyCount, 0);
                parser.execute(new Buffer('1'));
                assert.strictEqual(replyCount, 0);
                parser.execute(new Buffer('\r'));
                assert.strictEqual(replyCount, 0);
                parser.execute(new Buffer('\n'));
                assert.strictEqual(replyCount, 1);
            });

            it('do not return before \\r\\n', function () {
                var replyCount = 0;
                function checkReply(reply) {
                    assert.equal(reply, 1);
                    replyCount++;
                }
                var parser = new Parser({
                    returnReply: checkReply,
                    returnError: returnError,
                    returnFatalError: returnFatalError,
                    name: parserName
                });

                parser.execute(new Buffer(':1\r\n:'));
                assert.strictEqual(replyCount, 1);
                parser.execute(new Buffer('1'));
                assert.strictEqual(replyCount, 1);
                parser.execute(new Buffer('\r'));
                assert.strictEqual(replyCount, 1);
                parser.execute(new Buffer('\n'));
                assert.strictEqual(replyCount, 2);
            });

            it('return data as buffer if requested', function () {
                var replyCount = 0;
                function checkReply(reply) {
                    if (Array.isArray(reply)) {
                        reply = reply[0];
                    }
                    assert(Buffer.isBuffer(reply));
                    assert.strictEqual(reply.inspect(), new Buffer('test').inspect());
                    replyCount++;
                }
                var parser = new Parser({
                    returnReply: checkReply,
                    returnError: returnError,
                    returnFatalError: returnFatalError,
                    name: parserName,
                    returnBuffers: true
                });

                parser.execute(new Buffer('+test\r\n'));
                assert.strictEqual(replyCount, 1);
                parser.execute(new Buffer('$4\r\ntest\r\n'));
                assert.strictEqual(replyCount, 2);
                parser.execute(new Buffer('*1\r\n$4\r\ntest\r\n'));
                assert.strictEqual(replyCount, 3);
            });

            it('handle special case buffer sizes properly', function () {
                var replyCount = 0;
                var entries = ['test test ', 'test test test test ', 1234];
                function checkReply(reply) {
                    assert.strictEqual(reply, entries[replyCount]);
                    replyCount++;
                }
                var parser = new Parser({
                    returnReply: checkReply,
                    returnError: returnError,
                    returnFatalError: returnFatalError,
                    name: parserName
                });
                parser.execute(new Buffer('$10\r\ntest '));
                assert.strictEqual(replyCount, 0);
                parser.execute(new Buffer('test \r\n$20\r\ntest test test test \r\n:1234\r'));
                assert.strictEqual(replyCount, 2);
                parser.execute(new Buffer('\n'));
                assert.strictEqual(replyCount, 3);
            });

            it('return numbers as strings', function () {
                var replyCount = 0;
                var entries = ['123', '590295810358705700002', '-99999999999999999'];
                function checkReply(reply) {
                    assert.strictEqual(typeof reply, 'string');
                    assert.strictEqual(reply, entries[replyCount]);
                    replyCount++;
                }
                var unhookIntercept = intercept(function () {
                    return '';
                });
                var parser = new Parser({
                    returnReply: checkReply,
                    returnError: returnError,
                    returnFatalError: returnFatalError,
                    name: parserName,
                    stringNumbers: true
                });
                unhookIntercept();
                parser.execute(new Buffer(':123\r\n:590295810358705700002\r\n:-99999999999999999\r\n'));
                assert.strictEqual(replyCount, 3);
            });
        });
    });
});
