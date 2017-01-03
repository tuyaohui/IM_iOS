/*global before: false */
/*jslint node: true, nomen: true */
"use strict";

var child_process = require('child_process'),
    cp_remote = require('cp-remote'),
    path = require('path'),
    fs = require('fs'),
    async = require('async'),
    rimraf = require('rimraf'),
    yargs = require('yargs'),
    argv = yargs(JSON.parse(new Buffer(yargs.argv.data, 'hex')))
            .demand('rounds')
            .demand('size')
            .demand('ttl')
            .check(function (argv)
            {
                if (!(argv.queues || argv.remote))
                {
                    throw 'missing --queues or --remote';
                }

                if (argv.queues && argv.remote)
                {
                    throw "can't specify --queues and --remote";
                }
                
                return true;
            })
            .argv,
    fsq_dir = path.join(argv['fsq-dir'] || path.join(__dirname, '..', 'fsq'), 'fsq'),
    queues;

if (argv.remote)
{
    if (typeof argv.remote === 'string')
    {
        argv.remote = [argv.remote];
    }

    argv.queues = argv.remote.length;
}

function error(err)
{
    throw err;
}

/*jslint unparam: true */
before(function (times, done)
{
    async.series([
        function (cb)
        {
            rimraf(fsq_dir, cb);
        },
        function (cb)
        {
            async.times(argv.queues, function (n, cb)
            {
                var bench_fsq = path.join(__dirname, 'bench-fsq', 'bench-fsq.js'),
                    opts = new Buffer(JSON.stringify({
                        n: n,
                        queues: argv.queues,
                        rounds: argv.rounds,
                        size: argv.size,
                        ttl: argv.ttl * 1000,
                        fsq_dir: fsq_dir
                    })).toString('hex'),
                    child;
                    
                if (argv.remote)
                {
                    child = cp_remote.run(argv.remote[n], bench_fsq, opts);
                }
                else
                {
                    child = child_process.fork(bench_fsq, [opts]);
                }

                child.on('error', error);
                child.on('exit', error);

                child.on('message', function ()
                {
                    cb(null, child);
                });
            }, function (err, qs)
            {
                queues = qs;
                cb(err);
            });
        }], done);
});
/*jslint unparam: false */

exports.publish = function (done)
{
    async.each(queues, function (q, cb)
    {
        q.removeListener('exit', error);
        q.on('exit', function (code, signal)
        {
            cb(code || signal);
        });
        q.send({ type: 'start' });
    }, done);
};

