/*globals options: false */
/*jslint node: true */
"use strict";

var common = require('./common');

module.exports = function ()
{
    var matcher = new options.Matcher();

    common.add_bindings(matcher);
    common.match(matcher);
    common.remove_bindings(matcher);
};

