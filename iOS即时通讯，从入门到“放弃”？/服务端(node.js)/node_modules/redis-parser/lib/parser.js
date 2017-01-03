'use strict';

var parsers = {
    javascript: require('./javascript')
};

// Hiredis might not be installed
try {
    parsers.hiredis = require('./hiredis');
} catch (err) { /* ignore errors */ }

function Parser (options) {
    var parser, msg;

    if (
        !options ||
        typeof options.returnError !== 'function' ||
        typeof options.returnReply !== 'function'
    ) {
        throw new Error('Please provide all return functions while initiating the parser');
    }

    if (options.name === 'hiredis') {
        /* istanbul ignore if: hiredis should always be installed while testing */
        if (!parsers.hiredis) {
            msg = 'You explicitly required the hiredis parser but hiredis is not installed. The JS parser is going to be returned instead.';
        } else if (options.stringNumbers) {
            msg = 'You explicitly required the hiredis parser in combination with the stringNumbers option. Only the JS parser can handle that and is choosen instead.';
        }
    } else if (options.name && !parsers[options.name] && options.name !== 'auto') {
        msg = 'The requested parser "' + options.name + '" is unkown and the default parser is choosen instead.';
    }

    if (msg) {
        console.warn(new Error(msg).stack.replace('Error: ', 'Warning: '));
    }

    options.name = options.name || 'hiredis';
    options.name = options.name.toLowerCase();

    var innerOptions = {
        // The hiredis parser expects underscores
        return_buffers: options.returnBuffers || false,
        string_numbers: options.stringNumbers || false
    };

    if (options.name === 'javascript' || !parsers.hiredis || options.stringNumbers) {
        parser = new parsers.javascript(innerOptions);
    } else {
        parser = new parsers.hiredis(innerOptions);
    }

    parser.returnError = options.returnError;
    parser.returnFatalError = options.returnFatalError || options.returnError;
    parser.returnReply = options.returnReply;
    return parser;
}

module.exports = Parser;
