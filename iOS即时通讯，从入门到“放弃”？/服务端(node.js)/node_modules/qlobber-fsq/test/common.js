/*globals global,
          path: false,
          argv: false,
          beforeEach: false,
          afterEach: false,
          fsq_dir: false,
          constants: false,
          QlobberFSQ: false,
          async: false,
          rimraf: false,
          fsq: true,
          fs: false,
          expect: false,
          flags: false,
          retry_interval: false,
          ignore_ebusy: false,
          single_supported: false */
/*jslint node: true, nomen: true, bitwise: true */
"use strict";

try
{
    global.fs = require('fs-ext');
    global.single_supported = true;
}
catch (ex)
{
    global.fs = require('fs');
    global.single_supported = false;
}
global.path = require('path');
global.crypto = require('crypto');
global.os = require('os');
global.events = require('events');
global.util = require('util');
global.child_process = require('child_process');
global.rimraf = require('rimraf');
global.async = require('async');
global.lsof = require('lsof');
global.constants = require('constants');
global.expect = require('chai').expect;
global.cp_remote = require('cp-remote');
global.QlobberFSQ = require('..').QlobberFSQ;
global.argv = require('yargs').argv;

global.fsq = null;
global.fsq_dir = path.join(argv['fsq-dir'] || path.join(__dirname, 'fsq'), 'fsq');
global.msg_dir = path.join(fsq_dir, 'messages');
global.flags = 0;
global.retry_interval = 5;

if (argv.direct)
{
    global.flags |= constants.O_DIRECT;
}

if (argv.sync)
{
    global.flags |= constants.O_SYNC;
}

global.ignore_ebusy = function (fsq, extra)
{
    fsq.on('warning', function (err)
    {
        if (!(err && (err.code === 'EBUSY' || (extra && err.code === extra))))
        {
            console.error(err);
        }
    });

    if (!single_supported)
    {
        fsq.on('single_disabled', function () { });
    }
};

beforeEach(function (done)
{
    this.timeout(10 * 60 * 1000);

    async.series([
        function (cb)
        {
            function cleanup()
            {
                rimraf(fsq_dir, function (err)
                {
                    // FhGFS can return EBUSY. Sometimes it erroneously
                    // returns EBUSY instead of ENOTEMPTY, meaning rimraf
                    // never deletes the directory. Interestingly, modifying
                    // rimraf to remove children when it sees EBUSY results
                    // in it successfully removing the directory.
                    if (err && (err.code === 'EBUSY'))
                    {
                        console.error(err);
                        return setTimeout(cleanup, 1000);
                    }

                    cb(err);
                });
            }

            cleanup();
        },
        function (cb)
        {
            fsq = new QlobberFSQ(
            {
                fsq_dir: fsq_dir,
                flags: flags,
                retry_interval: retry_interval
            });

            ignore_ebusy(fsq);
            fsq.on('start', cb);
        }], done);
});

afterEach(function (done)
{
    fsq.stop_watching(done);
});

global.check_empty = function (dir, done, cb)
{
    fs.readdir(dir, function (err, files)
    {
        if (err) { return done(err); }

        async.eachSeries(files, function (subdir, next)
        {
            fs.readdir(path.join(dir, subdir), function (err, files)
            {
                if (err) { return next(err); }
                expect(files).to.eql([]);
                next();
            });
        }, function (err)
        {
            if (err) { return done(err); }
            cb();
        });
    });
};

global.sum = function (buf)
{
    var i, r = 0;

    for (i = 0; i < buf.length; i += 1)
    {
        r += buf[i];
    }

    return r;
};

