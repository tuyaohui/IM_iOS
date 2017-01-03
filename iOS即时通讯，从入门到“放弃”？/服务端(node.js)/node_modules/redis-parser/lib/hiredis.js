'use strict';

var hiredis = require('hiredis');

function HiredisReplyParser(options) {
    this.name = 'hiredis';
    this.options = options;
    this.reader = new hiredis.Reader(options);
}

HiredisReplyParser.prototype.parseData = function () {
    try {
        return this.reader.get();
    } catch (err) {
        // Protocol errors land here
        // Reset the parser. Otherwise new commands can't be processed properly
        this.reader = new hiredis.Reader(this.options);
        this.returnFatalError(err);
    }
};

HiredisReplyParser.prototype.execute = function (data) {
    this.reader.feed(data);
    var reply = this.parseData();

    while (reply !== undefined) {
        if (reply && reply.name === 'Error') {
            this.returnError(reply);
        } else {
            this.returnReply(reply);
        }
        reply = this.parseData();
    }
};

module.exports = HiredisReplyParser;
