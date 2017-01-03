var test = require('tap').test;
var AC = require('../ac.js');
var fs = require('fs');

test('basic', function(t) {
  var ac = new AC({
    max: 1,
    load: function(key, cb) {
      fs.stat(key, cb);
    }
  });

  var called = 0;
  var stFirst = null;
  var stSecond = null;

  t.equal(ac.itemCount, 0);
  ac.get(__filename, afterFirst);
  function afterFirst(er, st) {
    if (er) throw er;
    t.equal(ac.itemCount, 1);
    called ++;
    stFirst = st;
    t.pass('called the first one');
    if (called === 2) next();
  }

  var expectLoading = {}
  expectLoading[__filename] = [afterFirst]
  t.deepEqual(ac._loading, expectLoading);

  ac.get(__filename, afterSecond);
  function afterSecond(er, st) {
    if (er) throw er;
    t.equal(ac.itemCount, 1);
    called ++;
    stSecond = st;
    t.pass('called the second one');
    if (called === 2) next();
  }

  expectLoading[__filename].push(afterSecond);
  t.deepEqual(ac._loading, expectLoading);
  t.type(ac.peek(__filename), 'undefined');

  function next() {
    t.equal(ac.itemCount, 1);
    t.equal(stFirst, stSecond, 'should be same stat object');
    t.equal(stFirst, ac.peek(__filename), 'should be same stat object');
    t.deepEqual(ac._loading, {});
    t.equal(called, 2);
    ac.get(__filename, function(er, st) {
      if (er) throw er;
      t.equal(st, stFirst, 'should be cached stat object');
      next2();
    });
  }

  function next2() {
    // now make it fall out of cache by fetching a new one.
    ac.get(__dirname, function(er, st) {
      if (er) throw er;
      t.type(ac.peek(__filename), 'undefined');
      t.equal(ac.itemCount, 1);
      ac.get(__filename, function(er, st) {
        if (er) throw er;
        t.equal(ac.itemCount, 1);
        t.notEqual(st, stFirst, 'should have re-fetched');
        t.end();
      });
    });
  }
});

test('allow stale', function(t) {
  var v = 0;
  var ac = new AC({
    max: 1,
    load: function(key, cb) {
      setTimeout(function() {
        cb(null, v++);
      }, 100);
    },
    maxAge: 10,
    stale: true
  });

  t.equal(ac.itemCount, 0);
  ac.get('foo', function(er, val) {
    t.equal(ac.itemCount, 1);
    t.equal(val, 0);
    var start = Date.now();
    setTimeout(function() {
      ac.get('foo', function(er, val) {
        var end = Date.now();
        t.equal(val, 0);
        t.ok(end - start < 50, 'should be stale');
        t.end();
      });
    }, 15);
  });
});


test('return stale while updating', function(t){
  var isLoading = false;
  var start = Date.now();
  var maxAge = 500;
  var loadingTimes = 0;

  var ac = new AC({
    max: 1000,
    stale: true,
    maxAge: maxAge,
    load: function(key, cb) {
      isLoading = true;
      loadingTimes++;
      setTimeout(function(){
        isLoading = false;
        cb(null, { created: Date.now(), version: loadingTimes });
      }, 450);
    }
  });

  var times = 0;
  var staleTimes = 0;
  var responses = 0;

  function step(){
    var reqTime = Date.now();
    ac.get('someKey', function (err, item){
      var resTime = Date.now();
      if (err){
        throw err;
      } else {
        var itemAge = resTime - item.created;
        if (itemAge > maxAge)
          staleTimes++;

        responses++;

        // console.log(
        //   responses,
        //   'ReqTime: ', reqTime - start,
        //   'ResTime: ', resTime - start,
        //   '(' + (resTime - reqTime) + ')',
        //   'Is Loading', isLoading,
        //   'Item Age: ', itemAge,
        //   'Ver:', item.version)

        if (responses == 30) {
          t.equal(staleTimes, 10, '10 stale times')
          t.equal(loadingTimes, 3, '3 loading times')
          t.end();
        }
      }
    });
  }

  for (var i=0; i < 30; i++) {
    setTimeout(step, 100 * i);
  }

})
