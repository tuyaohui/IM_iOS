/*globals it: false,
          fsq: false,
          async: false,
          flags: false,
          expect: false,
          fsq_dir: false,
          sum: false,
          crypto: false,
          events: false,
          util: false,
          child_process: false,
          cp_remote: false,
          path: false,
          util: false,
          describe: false,
          argv: false,
          QlobberFSQ: false,
          os: false,
          rabbitmq_test_bindings: false,
          rabbitmq_expected_results_before_remove: false,
          rabbitmq_bindings_to_remove: false,
          rabbitmq_expected_results_after_remove: false,
          rabbitmq_expected_results_after_remove_all: false,
          rabbitmq_expected_results_after_clear: false */
/*jslint node: true, nomen: true */
"use strict";

function rabbitmq_tests(name, QCons, num_queues, rounds, msglen, retry_prob, expected, f)
{
    it('should pass rabbitmq tests (' + name + ', num_queues=' + num_queues + ', rounds=' + rounds + ', msglen=' + msglen + ', retry_prob=' + retry_prob + ')', function (done)
    {
        var timeout = 20 * 60 * 1000;
        this.timeout(timeout);

        fsq.stop_watching(function ()
        {
            async.times(num_queues, function (n, cb)
            {
                var fsq = new QCons({ fsq_dir: fsq_dir, flags: flags }, n);

                fsq.on('start', function ()
                {
                    cb(null, fsq);
                });
            }, function (err, fsqs)
            {
                if (err) { return done(err); }

                var i,
                    j,
                    q,
                    total = 0,
                    count = 0,
                    subs = [],
                    result = {},
                    expected2 = {},
                    expected_sums = {},
                    sums = {},
                    count_single = 0,
                    expected_single_sum = 0,
                    single_sum = 0,
                    result_single = [],
                    expected_result_single = [],
                    assigned = {};

                for (i = 0; i < expected.length; i += 1)
                {
                    total += expected[i][1].length * rounds;
                }

                function topic_sort(a, b)
                {
                    return parseInt(a.substr(1), 10) - parseInt(b.substr(1), 10);
                }

                for (i = 0; i < expected.length; i += 1)
                {
                    expected2[expected[i][0]] = [];

                    for (j = 0; j < rounds; j += 1)
                    {
                        expected2[expected[i][0]] = expected2[expected[i][0]].concat(expected[i][1]);
                    }

                    expected2[expected[i][0]].sort(topic_sort);
                }

                for (i = 0; i < rounds; i += 1)
                {
                    expected_result_single = expected_result_single.concat(Object.keys(expected2));
                }

                expected_result_single.sort();

                function received(n, topic, value, data, single)
                {
                    expect(subs[n][value], value).to.equal(true);

                    if (single)
                    {
                        expect(expected2[topic]).to.contain(value);
                        single_sum += Buffer.isBuffer(data) ? sum(data) : data;
                        result_single.push(topic);
                        count_single += 1;

                        //console.log(topic, n);
                    }
                    else
                    {
                        result[topic] = result[topic] || [];
                        result[topic].push(value);

                        sums[topic] = sums[topic] || 0;
                        sums[topic] += Buffer.isBuffer(data) ? sum(data) : data;

                        count += 1;
                    }

                    //console.log('count:', count, total);
                    //console.log('count_single:', count_single, expected.length * rounds);

                    if ((count === total) && (count_single === expected.length * rounds))
                    {
                        // wait a bit to catch duplicates
                        setTimeout(function ()
                        {
                            var t;

                            result_single.sort();
                            expect(result_single).to.eql(expected_result_single);
                            expect(single_sum).to.equal(expected_single_sum);

                            for (t in result)
                            {
                                if (result.hasOwnProperty(t))
                                {
                                    result[t].sort(topic_sort);
                                }
                            }

                            expect(result).to.eql(expected2);

                            expect(sums).to.eql(expected_sums);

                            async.each(fsqs, function (fsq, next)
                            {
                                fsq.stop_watching(next);
                            }, done);
                        }, 10 * 1000);
                    }
                    else
                    {
                        if (count_single > expected.length * rounds)
                        {
                            console.error(arguments, count_single, expected.length * rounds);
                            throw new Error('more single messages than expected');
                        }

                        if (count > total)
                        {
                            console.error(arguments, count, total);
                            throw new Error('more messages than expected total');
                        }
                    }
                }

                function subscribe(fsq, n, topic, value, cb)
                {
                    function handler(data, info, cb)
                    {
                        if (info.single && (Math.random() < retry_prob))
                        {
                            return cb('dummy retry');
                        }

                        received(n, info.topic, value, data, info.single);
                        cb();
                    }

                    fsq.subscribe(topic, handler, function ()
                    {
                        fsq.__submap = fsq.__submap || {};
                        fsq.__submap[value] = handler;
                        cb();
                    });
                }

                function unsubscribe(fsq, topic, value, cb)
                {
                    if (value)
                    {
                        fsq.unsubscribe(topic, fsq.__submap[value], function ()
                        {
                            delete fsq.__submap[value];
                            cb();
                        });
                    }
                    else
                    {
                        fsq.unsubscribe(topic, value, cb);
                    }
                }

                function publish()
                {
                    var pq = async.queue(function (task, cb)
                    {
                        var buf = crypto.randomBytes(msglen),
                            s = sum(buf),
                            pi;

                        expected_sums[task] = expected_sums[task] || 0;

                        for (pi = 0; pi < expected2[task].length / rounds; pi += 1)
                        {
                            expected_sums[task] += s;
                        }

                        expected_single_sum += s;

                        //console.log(task);

                        async.parallel(
                        [
                            function (cb)
                            {
                                fsqs[Math.floor(Math.random() * num_queues)].publish(
                                        task,
                                        buf,
                                        { ttl: timeout },
                                        cb);
                            },
                            function (cb)
                            {
                                fsqs[Math.floor(Math.random() * num_queues)].publish(
                                        task,
                                        buf,
                                        { ttl: timeout, single: true },
                                        cb);
                            }
                        ], cb);
                    }, num_queues * 5), pi, pj;

                    for (pi = 0; pi < rounds; pi += 1)
                    {
                        for (pj = 0; pj < expected.length; pj += 1)
                        {
                            pq.push(expected[pj][0]);
                        }
                    }

                    if (Object.keys(subs).length === 0)
                    {
                        pq.drain = function ()
                        {
                            //console.log('drained');

                            setTimeout(function ()
                            {
                                expect(count).to.equal(0);
                                expect(count_single).to.equal(0);

                                async.each(fsqs, function (fsq, next)
                                {
                                    fsq.stop_watching(next);
                                }, done);
                            }, 10 * 1000);
                        };
                    }
                }

                q = async.queue(function (i, cb)
                {
                    var n = Math.floor(Math.random() * num_queues),
                        entry = rabbitmq_test_bindings[i];

                    subs[n] = subs[n] || {};
                    subs[n][entry[1]] = true;
                    assigned[i] = n;
                    assigned[entry[0]] = assigned[entry[0]] || [];
                    assigned[entry[0]].push({ n: n, v: entry[1] });

                    subscribe(fsqs[n], n, entry[0], entry[1], cb);
                }, num_queues * 5);

                for (i = 0; i < rabbitmq_test_bindings.length; i += 1)
                {
                    q.push(i);
                }

                q.drain = function ()
                {
                    if (f)
                    {
                        f(fsqs, subs, assigned, unsubscribe, publish);
                    }
                    else
                    {
                        publish();
                    }
                };
            });
        });
    });
}

function rabbitmq(prefix, QCons, queues, rounds, msglen, retry_prob)
{
    rabbitmq_tests(prefix + 'before_remove', QCons, queues, rounds, msglen, retry_prob, rabbitmq_expected_results_before_remove);

    rabbitmq_tests(prefix + 'after_remove', QCons, queues, rounds, msglen, retry_prob, rabbitmq_expected_results_after_remove,
    function (fsqs, subs, assigned, unsubscribe, cb)
    {
        async.eachLimit(rabbitmq_bindings_to_remove, fsqs.length * 5,
        function (i, next)
        {
            var n = assigned[i - 1],
                v = rabbitmq_test_bindings[i - 1][1];
            
            unsubscribe(fsqs[n], rabbitmq_test_bindings[i - 1][0], v,
            function ()
            {
                assigned[i - 1] = null;
                subs[n][v] = null;
                next();
            });
        }, cb);
    });

    rabbitmq_tests(prefix + 'after_remove_all', QCons, queues, rounds, msglen, retry_prob, rabbitmq_expected_results_after_remove_all,
    function (fsqs, subs, assigned, unsubscribe, cb)
    {
        async.eachLimit(rabbitmq_bindings_to_remove, fsqs.length * 5,
        function (i, next)
        {
            var topic = rabbitmq_test_bindings[i - 1][0];

            async.eachLimit(assigned[topic], fsqs.length * 5, 
            function (nv, next2)
            {
                unsubscribe(fsqs[nv.n], topic, nv.v, function ()
                {
                    subs[nv.n][nv.v] = null;
                    next2();
                });
            }, function ()
            {
                assigned[i - 1] = null;
                assigned[topic] = [];
                next();
            });
        }, cb);
    });

    /*jslint unparam: true */
    rabbitmq_tests(prefix + 'after_clear', QCons, queues, rounds, msglen, retry_prob, rabbitmq_expected_results_after_clear,
    function (fsqs, subs, assigned, unsubscribe, cb)
    {
        async.each(fsqs, function (fsq, next)
        {
            unsubscribe(fsq, undefined, undefined, next);
        }, function ()
        {
            subs.length = 0;
            cb();
        });
    });
    /*jslint unparam: false */
}

function rabbitmq2(prefix, QCons, queues, rounds, msglen)
{
    rabbitmq(prefix, QCons, queues, rounds, msglen, 0);
    rabbitmq(prefix, QCons, queues, rounds, msglen, 0.25);
    rabbitmq(prefix, QCons, queues, rounds, msglen, 0.5);
    //rabbitmq(prefix, QCons, queues, rounds, msglen, 0.75);
}

function rabbitmq3(prefix, QCons, queues, rounds)
{
    rabbitmq2(prefix, QCons, queues, rounds, 1);
    rabbitmq2(prefix, QCons, queues, rounds, 1024);
    rabbitmq2(prefix, QCons, queues, rounds, 25 * 1024);
    //rabbitmq2(prefix, QCons, queues, rounds, 100 * 1024);
}

function rabbitmq4(prefix, QCons, queues)
{
    rabbitmq3(prefix, QCons, queues, 1);
    rabbitmq3(prefix, QCons, queues, 10);
    rabbitmq3(prefix, QCons, queues, 50);
    //rabbitmq3(prefix, QCons, queues, 100);
    //rabbitmq3(prefix, QCons, queues, 500);
    //rabbitmq3(prefix, QCons, queues, 1000);
}

function MPFSQBase(child)
{
    events.EventEmitter.call(this);

    var ths = this,
        handlers = {},
        handler_count = 0,
        pub_cbs = {},
        pub_cb_count = 0,
        sub_cbs = {},
        sub_cb_count = 0,
        unsub_cbs = {},
        unsub_cb_count = 0,
        topics = {};

    child.on('error', function (err)
    {
        ths.emit('error', err);
    });

    /*jslint unparam: true */
    child.on('exit', function (code, signal)
    {
        //console.log('exit', ths._host, code, signal);
        return undefined;
    });
    /*jslint unparam: false */

    child.on('message', function (msg)
    {
        var cb;

        //console.log("parent got message", msg);

        if (msg.type === 'start')
        {
            //console.log('got start', ths._host);
            ths.emit('start');
        }
        else if (msg.type === 'stop')
        {
            child.send({ type: 'exit' });
            ths.emit('stop');
        }
        else if (msg.type === 'received')
        {
            //console.log('recv', msg.host, msg.pid, msg.info.topic, msg.info.single, msg.handler);
            handlers[msg.handler](msg.sum, msg.info, function(err)
            {
                child.send(
                {
                    type: 'recv_callback',
                    cb: msg.cb,
                    err: err
                });
            });
        }
        else if (msg.type === 'sub_callback')
        {
            cb = sub_cbs[msg.cb];
            delete sub_cbs[msg.cb];
            //console.log('sub_callback', ths._host, msg.cb, Object.keys(sub_cbs));
            cb();
        }
        else if (msg.type === 'unsub_callback')
        {
            cb = unsub_cbs[msg.cb];
            delete unsub_cbs[msg.cb];
            //console.log('unsub_callback', ths._host, msg.cb, Object.keys(unsub_cbs));
            cb();
        }
        else if (msg.type === 'pub_callback')
        {
            cb = pub_cbs[msg.cb];
            delete pub_cbs[msg.cb];
            //console.log('pub_callback', ths._host, msg.cb, Object.keys(pub_cbs));
            cb(msg.err, msg.fname);
        }
    });

    this.subscribe = function (topic, handler, cb)
    {
        handlers[handler_count] = handler;
        handler.__count = handler_count;

        sub_cbs[sub_cb_count] = cb;

        topics[topic] = topics[topic] || {};
        topics[topic][handler_count] = true;

        child.send(
        {
            type: 'subscribe',
            topic: topic,
            handler: handler_count,
            cb: sub_cb_count
        });

        //console.log('subscribe', ths._host, topic, handler_count, sub_cb_count);

        handler_count += 1;
        sub_cb_count += 1;
    };

    this.unsubscribe = function (topic, handler, cb)
    {
        if (topic === undefined)
        {
            unsub_cbs[unsub_cb_count] = function ()
            {
                handlers = {};
                topics = {};
                cb();
            };

            child.send(
            {
                type: 'unsubscribe',
                cb: unsub_cb_count
            });

            unsub_cb_count += 1;
        }
        else if (handler === undefined)
        {
            var n = topics[topic];

            topics[topic].forEach(function (h)
            {
                unsub_cbs[unsub_cb_count] = function ()
                {
                    delete handlers[h];
                    n -= 1;
                    if (n === 0)
                    {
                        delete topics[topic];
                        cb();
                    }
                };

                child.send(
                {
                    type: 'unsubscribe',
                    topic: topic,
                    handler: h,
                    cb: unsub_cb_count
                });

                unsub_cb_count += 1;
            });
        }
        else
        {
            unsub_cbs[unsub_cb_count] = function ()
            {
                delete handlers[handler.__count];
                cb();
            };

            child.send(
            {
                type: 'unsubscribe',
                topic: topic,
                handler: handler.__count,
                cb: unsub_cb_count
            });

            unsub_cb_count += 1;
        }
    };

    this.publish = function (topic, payload, options, cb)
    {
        pub_cbs[pub_cb_count] = cb;

        child.send(
        {
            type: 'publish',
            topic: topic,
            payload: payload.toString('base64'),
            options: options,
            cb: pub_cb_count
        });

        //console.log('publish', ths._host, topic, pub_cb_count, Object.keys(pub_cbs));
        pub_cb_count += 1;
    };

    this.stop_watching = function (cb)
    {
        child.send({ type: 'stop_watching' });

        if (cb)
        {
            this.once('stop', cb);
        }
    };
}

util.inherits(MPFSQBase, events.EventEmitter);

function MPFSQ(options)
{
    MPFSQBase.call(
        this,
        child_process.fork(path.join(__dirname, 'mpfsq', 'mpfsq.js'),
                           [new Buffer(JSON.stringify(options)).toString('hex')]),
        options);
}

util.inherits(MPFSQ, MPFSQBase);

function make_RemoteMPFSQ(hosts)
{
    function RemoteMPFSQ(options, index)
    {
        this._host = hosts[index];

        MPFSQBase.call(
            this,
            cp_remote.run(hosts[index],
                          path.join(__dirname, 'mpfsq', 'mpfsq.js'),
                          new Buffer(JSON.stringify(options)).toString('hex')),
            options);
    }

    util.inherits(RemoteMPFSQ, MPFSQBase);

    return RemoteMPFSQ;
}

describe('rabbit', function ()
{
    if (argv.remote)
    {
        var hosts = typeof argv.remote === 'string' ? [argv.remote] : argv.remote;
        rabbitmq4('distributed ', make_RemoteMPFSQ(hosts), hosts.length);
    }
    else
    {
        /*rabbitmq4('', QlobberFSQ, 1);
        rabbitmq4('', QlobberFSQ, 10);
        rabbitmq4('', QlobberFSQ, 26);
        rabbitmq4('', QlobberFSQ, 100);*/

        rabbitmq4('multi-process ', MPFSQ, argv.queues || os.cpus().length);
    }
});
