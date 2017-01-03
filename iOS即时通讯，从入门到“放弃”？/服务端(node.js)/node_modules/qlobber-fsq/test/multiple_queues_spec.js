/*globals describe: false,
          it: false,
          fsq: false,
          async: false,
          QlobberFSQ: false,
          fsq_dir: false,
          flags: false,
          expect: false,
          msg_dir: false,
          sum: false,
          crypto: false,
          beforeEach: false,
          afterEach: false,
          single_supported: false */
/*jslint node: true */
"use strict";

describe('multiple queues', function ()
{
    var interval_handle;

    beforeEach(function ()
    {
        interval_handle = setInterval(function ()
        {
            console.log('still alive');
        }, 60 * 1000);
    });

    afterEach(function ()
    {
        clearInterval(interval_handle);
    });
    
    function publish_to_queues(name, num_queues, num_messages, max_message_size, get_single)
    {
        it('should publish to multiple queues (' + name + ', num_queues=' + num_queues + ', num_messages=' + num_messages + ', max_message_size=' + max_message_size + ')', function (done)
        {
            var timeout = 60 * 60 * 1000,
                num_single = 0,
                num_multi = 0,
                count_single = 0,
                count_multi = 0,
                the_fsqs,
                checksum = 0,
                expected_checksum = 0;

            this.timeout(timeout);

            fsq.stop_watching(function ()
            {
                /*jslint unparam: true */
                async.times(num_queues, function (n, cb)
                {
                    var fsq = new QlobberFSQ({ fsq_dir: fsq_dir, flags: flags }),
                        qcount = 0;

                    fsq.subscribe('foo', function (data, info, cb)
                    {
                        expect(info.topic).to.equal('foo');
                        if (typeof get_single === 'boolean')
                        {
                            expect(info.single).to.equal(get_single);
                        }
                        expect(info.path.lastIndexOf(msg_dir, 0)).to.equal(0);
                        expect(info.fname.lastIndexOf(new Buffer('foo').toString('hex') + '@', 0)).to.equal(0);

                        checksum += sum(data);

                        qcount += 1;

                        if (get_single === false)
                        {
                            expect(qcount).to.be.at.most(num_multi);
                        }

                        if (info.single)
                        {
                            count_single += 1;
                        }
                        else
                        {
                            count_multi += 1;
                        }

                        //console.log(count_single, num_single);
                        //console.log(count_multi, num_multi * num_queues);

                        if (the_fsqs &&
                            (count_single === num_single) &&
                            (count_multi === num_multi * num_queues))
                        {
                            async.each(the_fsqs, function (fsq, cb)
                            {
                                fsq.stop_watching(cb);
                            }, function ()
                            {
                                expect(checksum).to.be.above(0);
                                expect(checksum).to.equal(expected_checksum);
                                cb(null, done);
                            });
                        }
                        else
                        {
                            if (count_single > num_single)
                            {
                                throw new Error('single called too many times');
                            }

                            if (count_multi > num_multi * num_queues)
                            {
                                throw new Error('multi called too many times');
                            }
                            
                            cb();
                        }
                    });

                    fsq.on('start', function ()
                    {
                        cb(null, fsq);
                    });
                }, function (err, fsqs)
                {
                    if (err) { return done(err); }

                    expect(fsqs.length).to.equal(num_queues);

                    var messages = [], i;

                    for (i = 0; i < num_messages; i += 1)
                    {
                        messages[i] = i;
                    }

                    async.eachLimit(messages, 50, function (n, cb)
                    {
                        var single = typeof get_single === 'boolean' ? get_single : get_single(),
                            data = crypto.randomBytes(Math.round(Math.random() * max_message_size)),
                            check = sum(data);

                        if (single)
                        {
                            num_single += 1;
                            expected_checksum += check;
                        }
                        else
                        {
                            num_multi += 1;
                            expected_checksum += check * num_queues;
                        }

                        fsqs[Math.floor(Math.random() * num_queues)].publish(
                                'foo',
                                data,
                                { ttl: timeout, single: single, encoding: null },
                                cb);
                    }, function (err)
                    {
                        if (err) { return done(err); }
                        expect(num_single + num_multi).to.equal(num_messages);
                        
                        if ((count_single === num_single) &&
                            (count_multi === num_multi * num_queues))
                        {
                            return async.each(fsqs, function (fsq, cb)
                            {
                                fsq.stop_watching(cb);
                            }, function ()
                            {
                                expect(checksum).to.be.above(0);
                                expect(checksum).to.equal(expected_checksum);
                                done();
                            });
                        }

                        the_fsqs = fsqs;
                    });
                });
                /*jslint unparam: false */
            });
        });
    }

    function publish_to_queues2(num_queues, num_messages, max_message_size)
    {
        publish_to_queues('multi', num_queues, num_messages, max_message_size, false);
        if (single_supported)
        {
            publish_to_queues('single', num_queues, num_messages, max_message_size, true);
            publish_to_queues('mixed', num_queues, num_messages,  max_message_size,
            function ()
            {
                return Math.random() < 0.5;
            });
        }
    }

    function publish_to_queues3(num_queues, max_message_size)
    {
        publish_to_queues2(num_queues, 150, max_message_size);
        publish_to_queues2(num_queues, 1500, max_message_size);
        publish_to_queues2(num_queues, 15000, max_message_size);
    }

    publish_to_queues3(1, 200 * 1024);
    publish_to_queues3(10, 100 * 1024);
    publish_to_queues3(50, 20 * 1024);
});
