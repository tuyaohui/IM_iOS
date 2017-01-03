/*globals options: false */
/*jslint node: true */
"use strict";

var qlobber = require('..'),
    common = require('./common');

var matcher_default = new qlobber.Qlobber();
common.add_bindings(matcher_default);

var matcher_dedup = new qlobber.QlobberDedup();
common.add_bindings(matcher_dedup);

module.exports = function ()
{
    common.match(options.Matcher === qlobber.Qlobber ? matcher_default : matcher_dedup);
};

