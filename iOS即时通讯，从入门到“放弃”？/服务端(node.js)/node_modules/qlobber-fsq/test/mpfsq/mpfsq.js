/*jslint node: true */
"use strict";

var options = JSON.parse(new Buffer(process.argv[2], 'hex')),
    QlobberFSQ = require('../..').QlobberFSQ,
    fsq = new QlobberFSQ(options),
    cbs = {},
    cb_count = 0,
    handlers = {},
    host = require('os').hostname();

//console.log(options);

//console.log('run', host, process.pid);

function sum(buf)
{
    var i, r = 0;

    for (i = 0; i < buf.length; i += 1)
    {
        r += buf[i];
    }

    return r;
}

fsq.on('start', function ()
{
    process.send({ type: 'start' });
    //console.log('start', host, process.pid);
});

fsq.on('stop', function ()
{
    //console.log('stop', host, process.pid, handlers, cbs);
    process.send({ type: 'stop' });
});

process.on('message', function (msg)
{
    //console.log("child got message", msg);

    if (msg.type === 'subscribe')
    {
        handlers[msg.handler] = function (data, info, cb)
        {
            //console.log('got', host, process.pid, msg.topic, info.topic, info.single, info.path, msg.handler);

            cbs[cb_count] = cb;
            process.send(
            {
                type: 'received',
                handler: msg.handler,
                sum: sum(data),
                info: info,
                cb: cb_count,
                host: host,
                pid: process.pid
            });
            cb_count += 1;
        };

        fsq.subscribe(msg.topic, handlers[msg.handler], function ()
        {
            process.send(
            {
                type: 'sub_callback',
                cb: msg.cb
            });
        });

        //console.log(host, process.pid, 'sub', msg.topic);
    }
    else if (msg.type === 'recv_callback')
    {
        cbs[msg.cb](msg.err);
        delete cbs[msg.cb];
    }
    else if (msg.type === 'publish')
    {
        //console.log('publishing', host, process.pid, msg.topic, msg.options);

        fsq.publish(msg.topic, new Buffer(msg.payload, 'base64'), msg.options,
        function (err, fname)
        {
            process.send(
            {
                type: 'pub_callback',
                cb: msg.cb,
                err: err,
                fname: fname
            });
        });
    }
    else if (msg.type === 'stop_watching')
    {
        fsq.stop_watching();
    }
    else if (msg.type === 'exit')
    {
        process.exit();
    }
    else if (msg.type === 'unsubscribe')
    {
        if (msg.topic)
        {
            fsq.unsubscribe(msg.topic, handlers[msg.handler], function ()
            {
                delete handlers[msg.handler];
                process.send(
                {
                    type: 'unsub_callback',
                    cb: msg.cb
                });
            });
        }
        else
        {
            fsq.unsubscribe(function ()
            {
                handlers = {};
                process.send(
                {
                    type: 'unsub_callback',
                    cb: msg.cb
                });
            });
        }
    }
});
