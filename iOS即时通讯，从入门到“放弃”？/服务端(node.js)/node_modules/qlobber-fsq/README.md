# qlobber-fsq&nbsp;&nbsp;&nbsp;[![Build Status](https://travis-ci.org/davedoesdev/qlobber-fsq.png)](https://travis-ci.org/davedoesdev/qlobber-fsq) [![Coverage Status](https://coveralls.io/repos/davedoesdev/qlobber-fsq/badge.png?branch=master)](https://coveralls.io/r/davedoesdev/qlobber-fsq?branch=master) [![NPM version](https://badge.fury.io/js/qlobber-fsq.png)](http://badge.fury.io/js/qlobber-fsq)

Shared file system queue for Node.js.

- Supports pub-sub and work queues.
- Supports local file system for multi-core use.
- Tested with [FraunhoferFS (BeeGFS)](http://www.fhgfs.com/) and [CephFS](http://ceph.com/ceph-storage/file-system/) for distributed use.
- Highly configurable.
- Full set of unit tests, including stress tests.
- Use as a backend-less alternative to [RabbitMQ](http://www.rabbitmq.com/), [Redis pub-sub](http://redis.io/topics/pubsub) etc.
- Supports AMQP-like topics with single- and multi-level wildcards.
- Tested on Linux and Windows.

Example:

```javascript
var QlobberFSQ = require('qlobber-fsq').QlobberFSQ;
var fsq = new QlobberFSQ({ fsq_dir: '/shared/fsq' });
fsq.subscribe('foo.*', function (data, info)
{
    console.log(info.topic, data.toString('utf8'));
    var assert = require('assert');
    assert.equal(info.topic, 'foo.bar');
    assert.equal(data, 'hello');
});
fsq.on('start', function ()
{
    this.publish('foo.bar', 'hello');
});
```

You can publish messages using a separate process if you like:

```javascript
var QlobberFSQ = require('qlobber-fsq').QlobberFSQ;
var fsq = new QlobberFSQ({ fsq_dir: '/shared/fsq' });
fsq.stop_watching();
fsq.on('stop', function ()
{
    this.publish('foo.bar', 'hello');
});
```

Or use the streaming interface to read and write messages:

```javascript
var QlobberFSQ = require('qlobber-fsq').QlobberFSQ;
var fsq = new QlobberFSQ({ fsq_dir: '/shared/fsq' });
function handler(stream, info)
{
    var data = [];

    stream.on('readable', function ()
    {
        var chunk = stream.read();
        if (chunk)
        {
            data.push(chunk);
        }
    });

    stream.on('end', function ()
    {
        var str = Buffer.concat(data).toString('utf8');
        console.log(info.topic, str);
        var assert = require('assert');
        assert.equal(info.topic, 'foo.bar');
        assert.equal(str, 'hello');
    });
}
handler.accept_stream = true;
fsq.subscribe('foo.*', handler);
fsq.on('start', function ()
{
    fsq.publish('foo.bar').end('hello');
});
```

The API is described [here](#tableofcontents).

## Installation

```shell
npm install qlobber-fsq
```

## Limitations

- `qlobber-fsq` provides no guarantee that the order messages are given to subscribers is the same as the order in which the messages were written. If you want to maintain message order between readers and writers then you'll need to do it in your application (using ACKs, sliding windows etc). Alternatively, use the `order_by_expiry` [constructor](#qlobberfsqoptions) option to have messages delivered in order of the time they expire.

- `qlobber-fsq` does its best not to lose messages but in exceptional circumstances (e.g. process crash, file system corruption) messages may get dropped. You should design your application to be resilient against dropped messages.

- `qlobber-fsq` makes no assurances about the security or privacy of messages in transit or at rest. It's up to your application to encrypt messages if required.

- `qlobber-fsq` supports Node 0.12 onwards.

## Distributed filesystems

Note: When using a distributed file system with `qlobber-fsq`, ensure that you synchronize the time and date on all the computers you're using.

### FraunhoferFS (BeeGFS)

When using the FraunhoferFS distributed file system, set the following options in `fhgfs-client.conf`:

```
tuneFileCacheType             = none
tuneUseGlobalFileLocks        = true
```

`qlobber-fsq` has been tested with FraunhoferFS 2014.01 on Ubuntu 14.04 and FraunhoferFS 2012.10 on Ubuntu 13.10.

### CephFS

`qlobber-fsq` has been tested with CephFS 0.80 on Ubuntu 14.04. Note that you'll need to [upgrade your kernel](http://www.yourownlinux.com/2014/04/install-upgrade-to-linux-kernel-3-14-1-in-linux.html) to at least 3.14.1 in order to get the fix for [a bug](http://tracker.ceph.com/issues/7371) in CephFS.

## How it works

![How it works](http://rawgit.davedoesdev.com/davedoesdev/qlobber-fsq/master/diagrams/how_it_works.svg)

Under the directory you specify for `fsq_dir`, `qlobber-fsq` creates the following sub-directories:

- `staging` Whilst it's being published, each message is written to a file in the staging area. The filename itself contains the message's topic, when it expires, whether it should be read by one subscriber or many and a random sequence of characters to make it unique.
- `messages` Once published to the staging area, each message is moved into this directory. `qlobber-fsq` actually creates a number of sub-directories (called buckets) under `messages` and distributes message between buckets according to the hash of their filenames. This helps to reduce the number of directory entries that have to be read when a single message is written. 
- `topics` If a message's topic is long, a separate topic file is created for it in this directory.
- `update` This contains one file, `UPDATE`, which is updated with a random sequence of bytes (called a stamp) every time a message is moved into the `messages` directory. `UPDATE` contains a separate stamp for each bucket.

`qlobber-fsq` reads `UPDATE` at regular intervals to determine whether a new message has been written to a bucket. If it has then it processes each filename in the bucket's directory listing.

If the expiry time in the filename has passed then it deletes the message.

If the filename indicates the message can be read by many subscribers:

- If it's processed this filename before then stop processing this filename.
- If the topic in the filename matches any subscribers then call each subscriber with the file's content. It uses [`qlobber`](https://github.com/davedoesdev/qlobber) to pattern match topics to subscribers.
- Remember that we've processed the filename.

If the filename indicates the message can be read by only one subscriber (i.e. work queue semantics):

- Try to lock the file using `flock`. If it fails to lock the file then stop processing this filename.
- If the topic in the filename matches any subscribers then call one subscriber with the file's content.
- Truncate and delete the file before unlocking it. We truncate the file in case of directory caching.

## Licence

[MIT](LICENCE)

## Test

To run the default tests:

```shell
grunt test [--fsq-dir=<path>]
```

If you don't specify `--fsq-dir` then the default will be used (a directory named `fsq` in the `qlobber-fsq` module directory).

To run the stress tests (multiple queues in a single Node process):

```shell
grunt test-stress [--fsq-dir=<path>]
```

To run the multi-process tests (each process publishing and subscribing to different messages):

```shell
grunt test-multi [--fsq-dir=<path>] [--queues=<number of queues>]
```

If you omit `--queues` then one process will be created per core (detected with [`os.cpus()`](http://nodejs.org/api/os.html#os_os_cpus)).

To run the distributed tests (one Node process per remote host, each one publishing and subscribing to different messages);

```shell
grunt test-multi --fsq-dir=<path> --remote=<host1> --remote=<host2>
```

You can specify as many remote hosts as you like. The test uses [`cp-remote`](https://github.com/davedoesdev/cp-remote) to run a module on each remote host. Make sure on each host:

- The `qlobber-fsq` module is installed at the same location.
- Mount the same distributed file system on the directory you specify for `--fsq-dir`. FraunhoferFS and CephFS are the only distributed file systems currently supported.

Please note the multi-process and distributed tests don't run on Windows.

## Lint

```shell
grunt lint
```

## Code Coverage

```shell
grunt coverage [--fsq-dir=<path>]
```

[Instanbul](http://gotwarlost.github.io/istanbul/) results are available [here](http://rawgit.davedoesdev.com/davedoesdev/qlobber-fsq/master/coverage/lcov-report/index.html).

Coveralls page is [here](https://coveralls.io/r/davedoesdev/qlobber-fsq).

## Benchmarks

To run the benchmark:

```shell
grunt bench [--fsq-dir=<path>] \
            --rounds=<number of rounds> \
            --size=<message size> \
            --ttl=<message time-to-live in seconds> \
            (--queues=<number of queues> | \
             --remote=<host1> --remote=<host2> ...)
```

If you don't specify `--fsq-dir` then the default will be used (a directory named `fsq` in the `qlobber-fsq` module directory).

If you provide at least one `--remote <host>` argument then the benchmark will be distributed across multiple hosts using [`cp-remote`](https://github.com/davedoesdev/cp-remote). Make sure on each host:

- The `qlobber-fsq` module is installed at the same location.
- Mount the same distributed file system on the directory you specify for `--fsq-dir`. FraunhoferFS is the only distributed file system currently supported.

# API

<a name="tableofcontents"></a>


## Constructor
- <a name="toc_qlobberfsqoptions"></a>[QlobberFSQ](#qlobberfsqoptions)

## Publish and subscribe
- <a name="toc_qlobberfsqprototypesubscribetopic-handler-cb"></a><a name="toc_qlobberfsqprototype"></a>[QlobberFSQ.prototype.subscribe](#qlobberfsqprototypesubscribetopic-handler-cb)
- <a name="toc_qlobberfsqprototypeunsubscribetopic-handler-cb"></a>[QlobberFSQ.prototype.unsubscribe](#qlobberfsqprototypeunsubscribetopic-handler-cb)
- <a name="toc_qlobberfsqprototypepublishtopic-payload-options-cb"></a>[QlobberFSQ.prototype.publish](#qlobberfsqprototypepublishtopic-payload-options-cb)

## Lifecycle
- <a name="toc_qlobberfsqprototypestop_watchingcb"></a>[QlobberFSQ.prototype.stop_watching](#qlobberfsqprototypestop_watchingcb)
- <a name="toc_qlobberfsqprototyperefresh_now"></a>[QlobberFSQ.prototype.refresh_now](#qlobberfsqprototyperefresh_now)
- <a name="toc_qlobberfsqprototypeforce_refresh"></a>[QlobberFSQ.prototype.force_refresh](#qlobberfsqprototypeforce_refresh)

## Events
- <a name="toc_qlobberfsqeventsstart"></a><a name="toc_qlobberfsqevents"></a>[QlobberFSQ.events.start](#qlobberfsqeventsstart)
- <a name="toc_qlobberfsqeventsstop"></a>[QlobberFSQ.events.stop](#qlobberfsqeventsstop)
- <a name="toc_qlobberfsqeventserrorerr"></a>[QlobberFSQ.events.error](#qlobberfsqeventserrorerr)
- <a name="toc_qlobberfsqeventswarningerr"></a>[QlobberFSQ.events.warning](#qlobberfsqeventswarningerr)
- <a name="toc_qlobberfsqeventssingle_disablederr"></a>[QlobberFSQ.events.single_disabled](#qlobberfsqeventssingle_disablederr)

## QlobberFSQ([options])

> Creates a new `QlobberFSQ` object for publishing and subscribing to a file system queue.

**Parameters:**

- `{Object} [options]` Configures the file system queue. Valid properties are listed below: 
  - `{String} fsq_dir` The path to the file system queue directory. Note that the following sub-directories will be created under this directory if they don't exist: `messages`, `staging`, `topics` and `update`. Defaults to a directory named `fsq` in the `qlobber-fsq` module directory.

  - `{Boolean} encode_topics` Whether to hex-encode message topics. Because topic strings form part of message filenames, they're first hex-encoded. If you can ensure that your message topics contain only valid filename characters, set this to `false` to skip encoding.
  
  - `{Integer} split_topic_at` Maximum number of characters in a short topic. Short topics are contained entirely in a message's filename. Long topics are split so the first `split_topic_at` characters go in the filename and the rest are written to a separate file in the `topics` sub-directory. Obviously long topics are less efficient. Defaults to 200, which is the maximum for most common file systems. Note: if your `fsq_dir` is on an [`ecryptfs`](http://ecryptfs.org/) file system then you should set `split_topic_at` to 100.

  - `{Integer} bucket_base`, `{Integer} bucket_num_chars` Messages are distributed across different _buckets_ for efficiency. Each bucket is a sub-directory of the `messages` directory. The number of buckets is determined by the `bucket_base` and `bucket_num_chars` options. `bucket_base` is the radix to use for bucket names and `bucket_num_chars` is the number of digits in each name. For example, `bucket_base: 26` and `bucket_num_chars: 4` results in buckets `0000` through `pppp`. Defaults to `base_base: 16` and `bucket_num_chars: 2` (i.e. buckets `00` through `ff`).

  - `{Integer} bucket_stamp_size` The number of bytes to write to the `UPDATE` file when a message is published. The `UPDATE` file (in the `update` directory) is used to determine whether any messages have been published without having to scan all the bucket directories. Each bucket has a section in the `UPDATE` file, `bucket_stamp_size` bytes long. When a message is written to a bucket, its section is filled with random bytes. Defaults to 32.

  - `{Integer} flags` Extra flags to use when reading and writing files. You shouldn't need to use this option but if you do then it should be a bitwise-or of values in the (undocumented) Node `constants` module (e.g. `constants.O_DIRECT | constants.O_SYNC`). Defaults to 0.

  - `{Integer} unique_bytes` Number of random bytes to append to each message's filename (encoded in hex), in order to avoid name clashes. Defaults to 16. If you increase it (or change the algorithm to add some extra information like the hostname), be sure to reduce `split_topic_at` accordingly.

  - `{Integer} single_ttl` Default time-to-live (in milliseconds) for messages which should be read by at most one subscriber. This value is added to the current time and the resulting expiry time is put into the message's filename. After the expiry time, the message is ignored and deleted when convenient. Defaults to 1 hour. 

  - `{Integer} multi_ttl` Default time-to-live (in milliseconds) for messages which can be read by many subscribers. This value is added to the current time and the resulting expiry time is put into the message's filename. After the expiry time, the message is ignored and deleted when convenient. Defaults to 5 seconds.

  - `{Integer} poll_interval` `qlobber-fsq` reads the `UPDATE` file at regular intervals to check whether any messages have been written. `poll_interval` is the time (in milliseconds) between each check. Defaults to 1 second.

  - `{Boolean} notify` Whether to use [`fs.watch`](http://nodejs.org/api/fs.html#fs_fs_watch_filename_options_listener) to watch for changes to the `UPDATE` file. Note that this will be done in addition to reading it every `poll_interval` milliseconds because `fs.watch` (`inotify` underneath) can be unreliable, especially under high load. Defaults to `true`.

  - `{Integer} retry_interval` Some I/O operations can fail with an error indicating they should be retried. `retry_interval` is the time (in milliseconds) to wait before retrying. Dfaults to 1 second.

  - `{Integer} message_concurrency` The number of messages in each bucket to process at once. Defaults to 1.

  - `{Integer} bucket_concurrency` The number of buckets to process at once. Defaults to 1.

  - `{Integer} handler_concurrency` By default, a message is considered handled by a subscriber only when all its data has been read. If you set `handler_concurrency` to non-zero, a message is considered handled as soon as a subscriber receives it. The next message will then be processed straight away. The value of `handler-concurrency` limits the number of messages being handled by subscribers at any one time. Defaults to 0 (waits for all message data to be read).

  - `{Boolean} order_by_expiry` Pass messages to subscribers in order of their expiry time. If `true` then `bucket_base` and `bucket_num_chars` are forced to 1 so messages are written to a single bucket. Defaults to `false`.

  - `{Boolean} dedup` Whether to ensure each handler function is called at most once when a message is received. Defaults to `true`.

  - `{Boolean} single` Whether to process messages meant for _at most_ one subscriber (across all `QlobberFSQ` objects), i.e. work queues. This relies on the optional dependency [`fs-ext`](https://github.com/baudehlo/node-fs-ext). Defaults to `true` if `fs-ext` is installed, otherwise `false` (in which case a [`single_disabled`](#qlobberfsqeventssingle_disablederr) event will be emitted).

  - `{String} separator` The character to use for separating words in message topics. Defaults to `.`.

  - `{String} wildcard_one` The character to use for matching exactly one word in a message topic to a subscriber. Defaults to `*`.

  - `{String} wildcard_some` The character to use for matching zero or more words in a message topic to a subscriber. Defaults to `#`.

  - `{Function (info, handlers, cb(err, ready, filtered_handlers))} filter` Function called before each message is processed. You can use this to filter the subscribed handler functions to be called for the message (by passing the filtered list as the third argument to `cb`). If you want to ignore the message _at this time_ then pass `false` as the second argument to `cb`. `filter` will be called again later with the same message. Defaults to a function which calls `cb(null, true, handlers)`. `handlers` and `filtered_handlers` are ES6 Sets, or arrays if `options.dedup` is falsey.

<sub>Go: [TOC](#tableofcontents)</sub>

<a name="qlobberfsqprototype"></a>

## QlobberFSQ.prototype.subscribe(topic, handler, [cb])

> Subscribe to messages in the file system queue.

**Parameters:**

- `{String} topic` Which messages you're interested in receiving. Message topics are split into words using `.` as the separator. You can use `*` to match exactly one word in a topic or `#` to match zero or more words. For example, `foo.*` would match `foo.bar` whereas `foo.#` would match `foo`, `foo.bar` and `foo.bar.wup`. Note you can change the separator and wildcard characters by specifying the `separator`, `wildcard_one` and `wildcard_some` options when [constructing `QlobberFSQ` objects](#qlobberfsqoptions). See the [`qlobber` documentation](https://github.com/davedoesdev/qlobber#qlobberoptions) for more information. 
- `{Function} handler` Function to call when a new message is received on the file system queue and its topic matches against `topic`. `handler` will be passed the following arguments: 
  - `{Readable|Buffer} data` [Readable](http://nodejs.org/api/stream.html#stream_class_stream_readable) stream or message content as a [Buffer](http://nodejs.org/api/buffer.html#buffer_class_buffer). By default you'll receive the message content. If `handler` has a property `accept_stream` set to a truthy value then you'll receive a stream. Note that _all_ subscribers will receive the same stream or content for each message. You should take this into account when reading from the stream. The stream can be piped into multiple [Writable](http://nodejs.org/api/stream.html#stream_class_stream_writable) streams but bear in mind it will go at the rate of the slowest one.

  - `{Object} info` Metadata for the message, with the following properties:

    - `{String} fname` Name of the file in which the message is stored.
    - `{String} path` Full path to the file in which the message is stored.
    - `{String} topic` Topic the message was published with.
    - `{String} [topic_path]` Full path to the file in which the topic overspill is stored (only present if the topic is too long to fit in the file name).
    - `{Integer} expires` When the message expires (number of milliseconds after 1 January 1970 00:00:00 UTC).
    - `{Boolean} single` Whether this message is being given to at most one subscriber (across all `QlobberFSQ` objects).

  - `{Function} done` Function to call once you've handled the message. Note that calling this function is only mandatory if `info.single === true`, in order to delete and unlock the file. `done` takes two arguments:

    - `{Object} err` If an error occurred then pass details of the error, otherwise pass `null` or `undefined`.
    - `{Function} [finish]` Optional function to call once the message has been deleted and unlocked, in the case of `info.single === true`, or straight away otherwise. It will be passed the following argument:
      - `{Object} err` If an error occurred then details of the error, otherwise `null`.

- `{Function} [cb]` Optional function to call once the subscription has been registered. This will be passed the following argument: 
  - `{Object} err` If an error occurred then details of the error, otherwise `null`.

<sub>Go: [TOC](#tableofcontents) | [QlobberFSQ.prototype](#toc_qlobberfsqprototype)</sub>

## QlobberFSQ.prototype.unsubscribe([topic], [handler], [cb])

> Unsubscribe from messages in the file system queue.

**Parameters:**

- `{String} [topic]` Which messages you're no longer interested in receiving via the `handler` function. This should be a topic you've previously passed to [`subscribe`](#qlobberfsqprototypesubscribetopic-handler-cb). If topic is `undefined` then all handlers for all topics are unsubscribed. 
- `{Function} [handler]` The function you no longer want to be called with messages published to the topic `topic`. This should be a function you've previously passed to [`subscribe`](#qlobberfsqprototypesubscribetopic-handler-cb). If you subscribed `handler` to a different topic then it will still be called for messages which match that topic. If `handler` is undefined, all handlers for the topic `topic` are unsubscribed. 
- `{Function} [cb]` Optional function to call once `handler` has been unsubscribed from `topic`. This will be passed the following argument: 
  - `{Object} err` If an error occurred then details of the error, otherwise `null`.

<sub>Go: [TOC](#tableofcontents) | [QlobberFSQ.prototype](#toc_qlobberfsqprototype)</sub>

## QlobberFSQ.prototype.publish(topic, [payload], [options], [cb])

> Publish a message to the file system queue.

**Parameters:**

- `{String} topic` Message topic. The topic should be a series of words separated by `.` (or the `separator` character you provided to the [`QlobberFSQ constructor`](#qlobberfsqoptions)). Topic words can contain any character, unless you set `encode_topics` to `false` in the [`QlobberFSQ constructor`](#qlobberfsqoptions). In that case they can contain any valid filename character for your file system, although it's probably sensible to limit it to alphanumeric characters, `-`, `_` and `.`. 
- `{String | Buffer} [payload]` Message payload. If you don't pass a payload then `publish` will return a [Writable stream](http://nodejs.org/api/stream.html#stream_class_stream_writable) for you to write the payload into. 
- `{Object} [options]` Optional settings for this publication: 
  - `{Boolean} single` If `true` then the message will be given to _at most_ one interested subscriber, across all `QlobberFSQ` objects scanning the file system queue. Otherwise all interested subscribers will receive the message.

  - `{Integer} ttl` Time-to-live (in milliseconds) for this message. If you don't specify anything then `single_ttl` or `multi_ttl` (provided to the [`QlobberFSQ constructor`](#qlobberfsqoptions)) will be used, depending on the value of `single`. After the time-to-live for the message has passed, the message is ignored and deleted when convenient.

  - `{String} encoding` If `payload` is a string, the encoding to use when writing it out to the message file. Defaults to `utf8`.

  - `{Integer} mode` The file mode (permissions) to set on the message file. Defaults to octal `0666` (readable and writable to everyone).

  - `{Function} hasher` A hash function to use for deciding into which bucket the message should be placed. The hash function should return a `Buffer` at least 4 bytes long. It defaults to running `md5` on the message file name. If you supply a `hasher` function it will be passed the following arguments:

    - `{String} fname` Message file name.
    - `{Integer} expires` When the message expires (number of milliseconds after 1 January 1970 00:00:00 UTC).
    - `{String} topic` Message topic.
    - `{String|Buffer} payload` Message payload.
    - `{Object} options` The optional settings for this publication.

- `{Function} [cb]` Optional function to call once the message has been written to the file system queue. This will be called after the message has been moved into its bucket and is therefore available to subscribers in any `QlobberFSQ` object scanning the queue. It will be passed the following argument: 
  - `{Object} err` If an error occurred then details of the error, otherwise `null`.


**Return:**

`{Stream | undefined}` A [Writable stream](http://nodejs.org/api/stream.html#stream_class_stream_writable) if no `payload` was passed, otherwise `undefined`.

<sub>Go: [TOC](#tableofcontents) | [QlobberFSQ.prototype](#toc_qlobberfsqprototype)</sub>

## QlobberFSQ.prototype.stop_watching([cb])

> Stop scanning for new messages.

**Parameters:**

- `{Function]} [cb]` Optional function to call once scanning has stopped. Alternatively, you can listen for the [`stop` event](#qlobberfsqeventsstop).

<sub>Go: [TOC](#tableofcontents) | [QlobberFSQ.prototype](#toc_qlobberfsqprototype)</sub>

## QlobberFSQ.prototype.refresh_now()

> Check the `UPDATE` file now rather than waiting for the next periodic check to occur

<sub>Go: [TOC](#tableofcontents) | [QlobberFSQ.prototype](#toc_qlobberfsqprototype)</sub>

## QlobberFSQ.prototype.force_refresh()

> Scan for new messages in the `messages` sub-directory without checking whether the `UPDATE` file has changed.

<sub>Go: [TOC](#tableofcontents) | [QlobberFSQ.prototype](#toc_qlobberfsqprototype)</sub>

<a name="qlobberfsqevents"></a>

## QlobberFSQ.events.start()

> `start` event

`QlobberFSQ` objects fire a `start` event when they're ready to publish messages. Don't call [`publish`](#qlobberfsqprototypepublishtopic-payload-options-cb) until the `start` event is emitted or the message may be dropped. You can [`subscribe`](#qlobberfsqprototypesubscribetopic-options-handler-cb) to messages before `start` is fired, however.

A `start` event won't be fired after a [`stop`](#qlobberfsqeventsstop) event.

<sub>Go: [TOC](#tableofcontents) | [QlobberFSQ.events](#toc_qlobberfsqevents)</sub>

## QlobberFSQ.events.stop()

> `stop` event

`QlobberFSQ` objects fire a `stop` event after you call [`stop_watching`](#qlobberfsqprototypestop_watchingcb) and they've stopped scanning for new messages. Messages already read may still be being processed, however.

<sub>Go: [TOC](#tableofcontents) | [QlobberFSQ.events](#toc_qlobberfsqevents)</sub>

## QlobberFSQ.events.error(err)

> `error` event

`QlobberFSQ` objects fire an `error` event if an error occurs before [`start`](#qlobberfsqeventsstart) is emitted. The `QlobberFSQ` object is unable to continue at this point and is not scanning for new messages.

**Parameters:**

- `{Object} err` The error that occurred.

<sub>Go: [TOC](#tableofcontents) | [QlobberFSQ.events](#toc_qlobberfsqevents)</sub>

## QlobberFSQ.events.warning(err)

> `warning` event

`QlobberFSQ` objects fire a `warning` event if an error occurs after [`start`](#qlobberfsqeventsstart) is emitted. The `QlobberFSQ` object will still be scanning for new messages after emitting a `warning` event.

**Parameters:**

- `{Object} err` The error that occurred.

<sub>Go: [TOC](#tableofcontents) | [QlobberFSQ.events](#toc_qlobberfsqevents)</sub>

## QlobberFSQ.events.single_disabled(err)

> `single_disabled` event

`QlobberFSQ` objects fire a `single_disabled` event if they can't support work queue semantics.

**Parameters:**

- `{Object} err` The error that caused single-subscriber messages not to be supported.

<sub>Go: [TOC](#tableofcontents) | [QlobberFSQ.events](#toc_qlobberfsqevents)</sub>

_&mdash;generated by [apidox](https://github.com/codeactual/apidox)&mdash;_
