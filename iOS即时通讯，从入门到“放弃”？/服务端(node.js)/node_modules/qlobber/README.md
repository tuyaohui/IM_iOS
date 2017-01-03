# qlobber&nbsp;&nbsp;&nbsp;[![Build Status](https://travis-ci.org/davedoesdev/qlobber.png)](https://travis-ci.org/davedoesdev/qlobber) [![Coverage Status](https://coveralls.io/repos/davedoesdev/qlobber/badge.png?branch=master)](https://coveralls.io/r/davedoesdev/qlobber?branch=master) [![NPM version](https://badge.fury.io/js/qlobber.png)](http://badge.fury.io/js/qlobber)

Node.js globbing for amqp-like topics.

Example:

```javascript
var Qlobber = require('qlobber').Qlobber;
var matcher = new Qlobber();
matcher.add('foo.*', 'it matched!');
assert.deepEqual(matcher.match('foo.bar'), ['it matched!']);
```

The API is described [here](#tableofcontents).

qlobber is implemented using a trie, as described in the RabbitMQ blog posts [here](http://www.rabbitmq.com/blog/2010/09/14/very-fast-and-scalable-topic-routing-part-1/) and [here](http://www.rabbitmq.com/blog/2011/03/28/very-fast-and-scalable-topic-routing-part-2/).

## Installation

```shell
npm install qlobber
```

## Another Example

A more advanced example using topics from the [RabbitMQ topic tutorial](http://www.rabbitmq.com/tutorials/tutorial-five-python.html):

```javascript
var matcher = new Qlobber();
matcher.add('*.orange.*', 'Q1');
matcher.add('*.*.rabbit', 'Q2');
matcher.add('lazy.#', 'Q2');
assert.deepEqual(['quick.orange.rabbit',
                  'lazy.orange.elephant',
                  'quick.orange.fox',
                  'lazy.brown.fox',
                  'lazy.pink.rabbit',
                  'quick.brown.fox',
                  'orange',
                  'quick.orange.male.rabbit',
                  'lazy.orange.male.rabbit'].map(function (topic)
                  {
                      return matcher.match(topic).sort();
                  }),
                 [['Q1', 'Q2'],
                  ['Q1', 'Q2'],
                  ['Q1'],
                  ['Q2'],
                  ['Q2', 'Q2'],
                  [],
                  [],
                  [],
                  ['Q2']]);
```

## Licence

[MIT](LICENCE)

## Tests

qlobber passes the [RabbitMQ topic tests](https://github.com/rabbitmq/rabbitmq-server/blob/master/src/rabbit_tests.erl) (I converted them from Erlang to Javascript).

To run the tests:

```shell
grunt test
```

## Lint

```shell
grunt lint
```

## Code Coverage

```shell
grunt coverage
```

[Instanbul](http://gotwarlost.github.io/istanbul/) results are available [here](http://rawgit.davedoesdev.com/davedoesdev/qlobber/master/coverage/lcov-report/index.html).

Coveralls page is [here](https://coveralls.io/r/davedoesdev/qlobber).

## Benchmarks

```shell
grunt bench
```

qlobber is also benchmarked in [ascoltatori](https://github.com/mcollina/ascoltatori).

# API

_Source: [lib/qlobber.js](lib/qlobber.js)_

<a name="tableofcontents"></a>

- <a name="toc_qlobberoptions"></a>[Qlobber](#qlobberoptions)
- <a name="toc_qlobberprototypeaddtopic-val"></a><a name="toc_qlobberprototype"></a>[Qlobber.prototype.add](#qlobberprototypeaddtopic-val)
- <a name="toc_qlobberprototyperemovetopic-val"></a>[Qlobber.prototype.remove](#qlobberprototyperemovetopic-val)
- <a name="toc_qlobberprototypematchtopic"></a>[Qlobber.prototype.match](#qlobberprototypematchtopic)
- <a name="toc_qlobberprototypeclear"></a>[Qlobber.prototype.clear](#qlobberprototypeclear)
- <a name="toc_qlobberdedupoptions"></a>[QlobberDedup](#qlobberdedupoptions)
- <a name="toc_qlobberdedupprototypematchtopic"></a><a name="toc_qlobberdedupprototype"></a>[QlobberDedup.prototype.match](#qlobberdedupprototypematchtopic)

## Qlobber([options])

> Creates a new qlobber.

**Parameters:**

- `{Object} [options]` Configures the qlobber. Use the following properties: 
  - `{String} separator` The character to use for separating words in topics. Defaults to '.'. MQTT uses '/' as the separator, for example.

  - `{String} wildcard_one` The character to use for matching exactly one word in a topic. Defaults to '*'. MQTT uses '+', for example.

  - `{String} wildcard_some` The character to use for matching zero or more words in a topic. Defaults to '#'. MQTT uses '#' too.

<sub>Go: [TOC](#tableofcontents)</sub>

<a name="qlobberprototype"></a>

## Qlobber.prototype.add(topic, val)

> Add a topic matcher to the qlobber.

Note you can match more than one value against a topic by calling `add` multiple times with the same topic and different values.

**Parameters:**

- `{String} topic` The topic to match against.
- `{Any} val` The value to return if the topic is matched. `undefined` is not supported.

**Return:**

`{Qlobber}` The qlobber (for chaining).

<sub>Go: [TOC](#tableofcontents) | [Qlobber.prototype](#toc_qlobberprototype)</sub>

## Qlobber.prototype.remove(topic, [val])

> Remove a topic matcher from the qlobber.

**Parameters:**

- `{String} topic` The topic that's being matched against.
- `{Any} [val]` The value that's being matched. If you don't specify `val` then all matchers for `topic` are removed.

**Return:**

`{Qlobber}` The qlobber (for chaining).

<sub>Go: [TOC](#tableofcontents) | [Qlobber.prototype](#toc_qlobberprototype)</sub>

## Qlobber.prototype.match(topic)

> Match a topic.

**Parameters:**

- `{String} topic` The topic to match against.

**Return:**

`{Array}` List of values that matched the topic. This may contain duplicates.

<sub>Go: [TOC](#tableofcontents) | [Qlobber.prototype](#toc_qlobberprototype)</sub>

## Qlobber.prototype.clear()

> Reset the qlobber.

Removes all topic matchers from the qlobber.

**Return:**

`{Qlobber}` The qlobber (for chaining).

<sub>Go: [TOC](#tableofcontents) | [Qlobber.prototype](#toc_qlobberprototype)</sub>

## QlobberDedup([options])

> Creates a new de-duplicating qlobber.

Inherits from [Qlobber](#qlobberoptions).

**Parameters:**

- `{Object} [options]` Same options as [Qlobber](#qlobberoptions).

<sub>Go: [TOC](#tableofcontents)</sub>

<a name="qlobberdedupprototype"></a>

## QlobberDedup.prototype.match(topic)

> Match a topic.

**Parameters:**

- `{String} topic` The topic to match against.

**Return:**

`{Set}` [ES6 Set](http://www.ecma-international.org/ecma-262/6.0/#sec-set-objects) of values that matched the topic.

<sub>Go: [TOC](#tableofcontents) | [QlobberDedup.prototype](#toc_qlobberdedupprototype)</sub>

_&mdash;generated by [apidox](https://github.com/codeactual/apidox)&mdash;_
