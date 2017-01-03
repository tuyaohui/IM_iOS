/*globals options: false */
/*jslint node: true */
"use strict";

var qlobber = require('..'),
    util = require("util"),
    common = require('./common');

module.exports = function ()
{
    var matcher = new options.Matcher(
    {
        separator: "/",
        wildcard_one: "+"
    }), i, j, vals;

    for (i = 0; i < 60000; i += 1)
    {
        for (j = 0; j < 100; j += 1)
        {
            matcher.add('app/test/user/behrad/testTopic-' + j, i);
        }
        matcher.add('app/test/user/behrad/+', i);
    }
    
    vals = matcher.match('app/test/user/behrad/testTopic-0');

    if (options.Matcher === qlobber.Qlobber)
    {
        common.remove_duplicates(vals);
    }
};
