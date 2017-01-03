/*global rabbitmq_test_bindings: false,
         rabbitmq_expected_results_before_remove: false */
/*jslint node: true, unparam: true */
"use strict";

var async = require('async'),
    crypto = require('crypto');
require('../../../test/rabbitmq_bindings.js');

var options = JSON.parse(new Buffer(process.argv[2], 'hex')),
    QlobberFSQ = require('../../..').QlobberFSQ,
    fsq = new QlobberFSQ(options),
    payload = crypto.randomBytes(options.size),
    expected = 0;

function handler()
{
    expected -= 1;

    if (expected === 0)
    {
        process.exit();
    }
}

fsq.on('start', function ()
{
    var i, j, b, sub_topics = [];

    for (i = 0; i < rabbitmq_test_bindings.length; i += 1)
    {
        if (i % options.queues === options.n)
        {
            b = rabbitmq_test_bindings[i];
            fsq.subscribe(b[0], handler);
            sub_topics.push(b[1]);
        }
    }

    for (i = 0; i < rabbitmq_expected_results_before_remove.length; i += 1)
    {
        for (j = 0; j < sub_topics.length; j += 1)
        {
            if (rabbitmq_expected_results_before_remove[i][1].indexOf(sub_topics[j]) >= 0)
            {
                expected += 1;
                break;
            }
        }
    }

    expected *= options.rounds;

    process.send({ type: 'ready' });
});

process.on('message', function (msg)
{
    async.timesSeries(options.rounds, function (r, cb)
    {
        async.times(rabbitmq_expected_results_before_remove.length, function (i, cb)
        {
            if (i % options.queues === options.n)
            {
                fsq.publish(rabbitmq_expected_results_before_remove[i][0],
                            payload,
                            { ttl: options.ttl },
                            cb);
            }
            else
            {
                cb();
            }
        }, cb);
    }, function ()
    {
        if (expected === 0)
        {
            process.exit();
        }
    });
});

