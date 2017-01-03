/*globals rabbitmq_test_bindings : false,
          rabbitmq_bindings_to_remove : false,
          rabbitmq_expected_results_before_remove: false,
          rabbitmq_expected_results_after_remove : false,
          rabbitmq_expected_results_after_remove_all : false,
          rabbitmq_expected_results_after_clear : false,
          describe: false,
          beforeEach: false,
          it: false */
/*jslint node: true */
"use strict";

var expect = require('chai').expect,
    qlobber = require('..');

describe('qlobber', function ()
{
    var matcher;

    beforeEach(function (done)
    {
        matcher = new qlobber.Qlobber();
        done();
    });

    function add_bindings(bindings, mapper)
    {
        mapper = mapper || function (topic) { return topic; };

        bindings.forEach(function (topic_val)
        {
            matcher.add(topic_val[0], mapper(topic_val[1]));
        });
    }

    function remove_duplicates_filter(item, index, arr)
    {
        return item !== arr[index - 1];
    }

    Array.prototype.remove_duplicates = function ()
    {
        return this.sort().filter(remove_duplicates_filter);
    };

    function get_trie(matcher, t)
    {
        t = t || matcher.get_trie();
        var k, r = {};
        for (k of t.keys())
        {
            if (k === '.')
            {
                r[k] = t.get(k);
            }
            else
            {
                r[k] = get_trie(matcher, t.get(k));
            }
        }
        return r;
    }

    it('should support adding bindings', function ()
    {
        add_bindings(rabbitmq_test_bindings);

        expect(get_trie(matcher)).to.eql({"a":{"b":{"c":{".":["t1","t20"]},"b":{"c":{".":["t4"]},".":["t14"]},".":["t15"]},"*":{"c":{".":["t2"]},".":["t9"]},"#":{"b":{".":["t3"]},".":["t11"],"#":{".":["t12"]}}},"#":{".":["t5"],"#":{".":["t6"],"#":{".":["t24"]}},"b":{".":["t7"],"#":{".":["t26"]}},"*":{"#":{".":["t22"]}}},"*":{"*":{".":["t8"],"*":{".":["t18"]}},"b":{"c":{".":["t10"]}},"#":{".":["t21"],"#":{".":["t23"]}},".":["t25"]},"b":{"b":{"c":{".":["t13"]}},"c":{".":["t16"]}},"":{".":["t17"]},"vodka":{"martini":{".":["t19"]}}});
    });

    it('should pass rabbitmq test', function ()
    {
        add_bindings(rabbitmq_test_bindings);

        rabbitmq_expected_results_before_remove.forEach(function (test)
        {
            expect(matcher.match(test[0]).remove_duplicates(), test[0]).to.eql(test[1].sort());
        });
    });

    it('should support removing bindings', function ()
    {
        add_bindings(rabbitmq_test_bindings);

        rabbitmq_bindings_to_remove.forEach(function (i)
        {
            matcher.remove(rabbitmq_test_bindings[i-1][0],
                           rabbitmq_test_bindings[i-1][1]);
        });

        expect(get_trie(matcher)).to.eql({"a":{"b":{"c":{".":["t20"]},"b":{"c":{".":["t4"]},".":["t14"]},".":["t15"]},"*":{"c":{".":["t2"]},".":["t9"]},"#":{"b":{".":["t3"]},"#":{".":["t12"]}}},"#":{"#":{".":["t6"],"#":{".":["t24"]}},"b":{".":["t7"],"#":{".":["t26"]}},"*":{"#":{".":["t22"]}}},"*":{"*":{".":["t8"],"*":{".":["t18"]}},"b":{"c":{".":["t10"]}},"#":{"#":{".":["t23"]}},".":["t25"]},"b":{"b":{"c":{".":["t13"]}},"c":{".":["t16"]}},"":{".":["t17"]}});

        rabbitmq_expected_results_after_remove.forEach(function (test)
        {
            expect(matcher.match(test[0]).remove_duplicates(), test[0]).to.eql(test[1].sort());
        });
        
        /*jslint unparam: true */
        var remaining = rabbitmq_test_bindings.filter(function (topic_val, i)
        {
            return rabbitmq_bindings_to_remove.indexOf(i + 1) < 0;
        });
        /*jslint unparam: false */

        remaining.forEach(function (topic_val)
        {
            matcher.remove(topic_val[0], topic_val[1]);
        });
            
        expect(matcher.get_trie()).to.eql({});

        rabbitmq_expected_results_after_clear.forEach(function (test)
        {
            expect(matcher.match(test[0]).remove_duplicates(), test[0]).to.eql(test[1].sort());
        });
    });

    it('should support clearing the bindings', function ()
    {
        add_bindings(rabbitmq_test_bindings);

        matcher.clear();

        rabbitmq_expected_results_after_clear.forEach(function (test)
        {
            expect(matcher.match(test[0]).remove_duplicates(), test[0]).to.eql(test[1].sort());
        });
    });

    it('should support removing all values for a topic', function ()
    {
        add_bindings(rabbitmq_test_bindings);

        rabbitmq_bindings_to_remove.forEach(function (i)
        {
            matcher.remove(rabbitmq_test_bindings[i-1][0]);
        });
        
        expect(get_trie(matcher)).to.eql({"a":{"b":{"b":{"c":{".":["t4"]},".":["t14"]},".":["t15"]},"*":{"c":{".":["t2"]},".":["t9"]},"#":{"b":{".":["t3"]},"#":{".":["t12"]}}},"#":{"#":{".":["t6"],"#":{".":["t24"]}},"b":{".":["t7"],"#":{".":["t26"]}},"*":{"#":{".":["t22"]}}},"*":{"*":{".":["t8"],"*":{".":["t18"]}},"b":{"c":{".":["t10"]}},"#":{"#":{".":["t23"]}},".":["t25"]},"b":{"b":{"c":{".":["t13"]}},"c":{".":["t16"]}},"":{".":["t17"]}});

        rabbitmq_expected_results_after_remove_all.forEach(function (test)
        {
            expect(matcher.match(test[0]).remove_duplicates(), test[0]).to.eql(test[1].sort());
        });
    });

    it('should support functions as values', function ()
    {
        add_bindings(rabbitmq_test_bindings, function (topic)
        {
            return function ()
            {
                return topic;
            };
        });

        rabbitmq_expected_results_before_remove.forEach(function (test)
        {
            expect(matcher.match(test[0], test[0]).map(function (f)
            {
                return f();
            }).remove_duplicates()).to.eql(test[1].sort());
        });
    });

    it('should pass example in README', function ()
    {
        matcher.add('foo.*', 'it matched!');
        expect(matcher.match('foo.bar')).to.eql(['it matched!']);
    });

    it('should pass example in rabbitmq topic tutorial', function ()
    {
	    matcher.add('*.orange.*', 'Q1');
        matcher.add('*.*.rabbit', 'Q2');
        matcher.add('lazy.#', 'Q2');
        expect(['quick.orange.rabbit',
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
                })).to.eql(
               [['Q1', 'Q2'],
                ['Q1', 'Q2'],
                ['Q1'],
                ['Q2'],
                ['Q2', 'Q2'],
                [],
                [],
                [],
                ['Q2']]);
    });

    it('should not remove anything if not previously added', function ()
    {
        matcher.add('foo.*', 'it matched!');
        matcher.remove('foo');
        matcher.remove('foo.*', 'something');
        matcher.remove('bar.*');
        expect(matcher.match('foo.bar')).to.eql(['it matched!']);
    });

    it('should accept wildcards in match topics', function ()
    {
        matcher.add('foo.*', 'it matched!');
        matcher.add('foo.#', 'it matched too!');
        expect(matcher.match('foo.*').sort()).to.eql(['it matched too!', 'it matched!']);
        expect(matcher.match('foo.#').sort()).to.eql(['it matched too!', 'it matched!']);
    });

    it('should be configurable', function ()
    {
        matcher = new qlobber.Qlobber({
            separator: '/',
            wildcard_one: '+',
            wildcard_some: 'M'
        });

        matcher.add('foo/+', 'it matched!');
        matcher.add('foo/M', 'it matched too!');
        expect(matcher.match('foo/bar').sort()).to.eql(['it matched too!', 'it matched!']);
        expect(matcher.match('foo/bar/end').sort()).to.eql(['it matched too!']);

    });

    it('should match expected number of topics', function ()
    {
        // under coverage this takes longer
        this.timeout(60000);

        var i, j, vals;

        for (i = 0; i < 60000; i += 1)
        {
            for (j = 0; j < 5; j += 1)
            {
                matcher.add('app.test.user.behrad.testTopic-' + j, i);
            }
            matcher.add('app.test.user.behrad.*', i);
        }

        vals = matcher.match('app.test.user.behrad.testTopic-0');

        expect(vals.length).to.equal(120000);
        expect(vals.remove_duplicates().length).to.equal(60000);
    });
});

