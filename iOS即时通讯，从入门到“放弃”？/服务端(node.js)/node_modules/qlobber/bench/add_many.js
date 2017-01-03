/*globals options: false */
/*jslint node: true */
"use strict";

var qlobber = require('..'),
    util = require("util");

module.exports = function ()
{
    var matcher = new options.Matcher(
    {
        separator: "/",
        wildcard_one: "+"
    }), i, j;

    for (i = 0; i < 60000; i += 1)
    {
        for (j = 0; j < 5; j += 1)
        {
            if (options.Matcher === qlobber.Qlobber)
            {
                // mosca pre-dedup checks whether already added
                matcher.match('app/test/user/behrad/testTopic-' + j).indexOf(i);
            }
            matcher.add('app/test/user/behrad/testTopic-' + j, i);
        }
    }
};
