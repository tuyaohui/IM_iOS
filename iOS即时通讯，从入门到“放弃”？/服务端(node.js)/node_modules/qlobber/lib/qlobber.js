/**
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
*/

/*jslint node: true, nomen: true */
"use strict";

var util = require('util');

/**
Creates a new qlobber.

@constructor
@param {Object} [options] Configures the qlobber. Use the following properties:

  - `{String} separator` The character to use for separating words in topics. Defaults to '.'. MQTT uses '/' as the separator, for example.

  - `{String} wildcard_one` The character to use for matching exactly one word in a topic. Defaults to '*'. MQTT uses '+', for example.

  - `{String} wildcard_some` The character to use for matching zero or more words in a topic. Defaults to '#'. MQTT uses '#' too.
*/
function Qlobber (options)
{
    options = options || {};

    this._separator = options.separator || '.';
    this._wildcard_one = options.wildcard_one || '*';
    this._wildcard_some = options.wildcard_some || '#';
    this._trie = new Map();
}

Qlobber.prototype._initial_value = function (val)
{
    return [val];
};

Qlobber.prototype._add_value = function (vals, val)
{
    vals[vals.length] = val;
};

Qlobber.prototype._add_values = function (dest, origin)
{
    var i, destLength = dest.length, originLength = origin.length;

    for (i = 0; i < originLength; i += 1)
    {
        dest[destLength + i] = origin[i];
    }
};

Qlobber.prototype._remove_value = function (vals, val)
{
    var index = vals.lastIndexOf(val);

    if (index >= 0)
    {
        vals.splice(index, 1);
    }

    return vals.length === 0;
};

Qlobber.prototype._add = function (val, i, words, sub_trie)
{
    var st, word;

    if (i === words.length)
    {
        st = sub_trie.get(this._separator);
        
        if (st)
        {
            this._add_value(st, val);
        }
        else
        {
            sub_trie.set(this._separator, this._initial_value(val));
        }
        
        return;
    }

    word = words[i];
    st = sub_trie.get(word);
    
    if (!st)
    {
        st = new Map();
        sub_trie.set(word, st);
    }
    
    this._add(val, i + 1, words, st);
};

Qlobber.prototype._remove = function (val, i, words, sub_trie)
{
    var st, word;

    if (i === words.length)
    {
        st = sub_trie.get(this._separator);

        if (st &&
            ((val === undefined) ||
             this._remove_value(st, val)))
        {
            sub_trie.delete(this._separator);
        }

        return;
    }
    
    word = words[i];
    st = sub_trie.get(word);

    if (!st)
    {
        return;
    }

    this._remove(val, i + 1, words, st);

    if (st.size === 0)
    {
        sub_trie.delete(word);
    }
};

Qlobber.prototype._some = function (v, i, words, st)
{
    var j, w;

    for (w of st.keys())
    {
        if (w !== this._separator)
        {
            for (j = i; j < words.length; j += 1)
            {
                v = this._match(v, j, words, st);
            }
            break;
        }
    }

    return v;
};

Qlobber.prototype._match = function (v, i, words, sub_trie)
{
    var word, st;

    st = sub_trie.get(this._wildcard_some);

    if (st)
    {
        // in the common case there will be no more levels...
        v = this._some(v, i, words, st);
        // and we'll end up matching the rest of the words:
        v = this._match(v, words.length, words, st);
    }

    if (i === words.length)
    {
        st = sub_trie.get(this._separator);

        if (st)
        {
            if (v.dest)
            {
                this._add_values(v.dest, v.source);
                this._add_values(v.dest, st);
                v = v.dest;
            }
            else if (v.source)
            {
                v.dest = v.source;
                v.source = st;
            }
            else
            {
                this._add_values(v, st);
            }
        }
    }
    else
    {
        word = words[i];

        if ((word !== this._wildcard_one) && (word !== this._wildcard_some))
        {
            st = sub_trie.get(word);

            if (st)
            {
                v = this._match(v, i + 1, words, st);
            }
        }

        if (word)
        {
            st = sub_trie.get(this._wildcard_one);

            if (st)
            {
                v = this._match(v, i + 1, words, st);
            }
        }
    }

    return v;
};

Qlobber.prototype._match2 = function (v, topic)
{
    var vals = this._match(
    {
        source: v
    }, 0, topic.split(this._separator), this._trie);

    return vals.source || vals;
};

/**
Add a topic matcher to the qlobber.

Note you can match more than one value against a topic by calling `add` multiple times with the same topic and different values.

@param {String} topic The topic to match against.
@param {Any} val The value to return if the topic is matched. `undefined` is not supported.
@return {Qlobber} The qlobber (for chaining).
*/
Qlobber.prototype.add = function (topic, val)
{
    this._add(val, 0, topic.split(this._separator), this._trie);
    return this;
};

/**
Remove a topic matcher from the qlobber.

@param {String} topic The topic that's being matched against.
@param {Any} [val] The value that's being matched. If you don't specify `val` then all matchers for `topic` are removed.
@return {Qlobber} The qlobber (for chaining).
*/
Qlobber.prototype.remove = function (topic, val)
{
    this._remove(val, 0, topic.split(this._separator), this._trie);
    return this;
};

/**
Match a topic.

@param {String} topic The topic to match against.
@return {Array} List of values that matched the topic. This may contain duplicates.
*/
Qlobber.prototype.match = function (topic)
{
    return this._match2([], topic);
};

/**
Reset the qlobber.

Removes all topic matchers from the qlobber.

@return {Qlobber} The qlobber (for chaining).
*/
Qlobber.prototype.clear = function ()
{
    this._trie = new Map();
    return this;
};

// for debugging
Qlobber.prototype.get_trie = function ()
{
    return this._trie;
};

/**
Creates a new de-duplicating qlobber.

Inherits from Qlobber.

@constructor
@param {Object} [options] Same options as Qlobber.
*/
function QlobberDedup (options)
{
    Qlobber.call(this, options);
}

util.inherits(QlobberDedup, Qlobber);

QlobberDedup.prototype._initial_value = function (val)
{
    return new Set().add(val);
};

QlobberDedup.prototype._add_value = function (vals, val)
{
    vals.add(val);
};

QlobberDedup.prototype._add_values = function (dest, origin)
{
    origin.forEach(function (val)
    {
        dest.add(val);
    });
};

QlobberDedup.prototype._remove_value = function (vals, val)
{
    vals.delete(val);
    return vals.size === 0;
};

/**
Match a topic.

@param {String} topic The topic to match against.
@return {Set} [ES6 Set](http://www.ecma-international.org/ecma-262/6.0/#sec-set-objects) of values that matched the topic.
*/
QlobberDedup.prototype.match = function (topic)
{
    return this._match2(new Set(), topic);
};

exports.Qlobber = Qlobber;
exports.QlobberDedup = QlobberDedup;

