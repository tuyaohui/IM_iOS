var test = require('tap').test;
var MA = require('..');

test('moving average with no time span errors', function(t) {
  t.plan(1);
  t.throws(function() {
    MA();
  });
});

test('moving average with zero time errors', function(t) {
  t.plan(1);
  t.throws(function() {
    MA(0);
  });
});

test('moving average with negative time errors', function(t) {
  t.plan(1);
  t.throws(function() {
    MA(-1);
  });
});

test('moving average with one value gets that value', function(t) {
  t.plan(1);

  var ma = MA(5000);
  ma.push(Date.now(), 5);
  t.strictEqual(ma.movingAverage(), 5);
});

test('moving average on a constant value returns that value', function(t) {
  t.plan(1);

  var ma = MA(5000);

  var now = Date.now();
  ma.push(now, 5);
  ma.push(now + 1000, 5);
  ma.push(now + 2000, 5);
  ma.push(now + 3000, 5);

  t.strictEqual(ma.movingAverage(), 5);
});

test('moving average works', function(t) {
  t.plan(2);

  var ma = MA(50000);

  var now = Date.now();
  ma.push(now, 1);
  ma.push(now + 1000, 2);
  ma.push(now + 2000, 3);
  ma.push(now + 3000, 3);
  ma.push(now + 4000, 10);

  var m = ma.movingAverage();
  t.ok(m < 1.28);
  t.ok(m > 1.27);
});

test('variance is 0 on one sample', function(t) {
  t.plan(1);

  var ma = MA(5000);
  ma.push(Date.now(), 5);

  t.strictEqual(ma.variance(), 0);
});

test('variance works (1)', function(t) {
  t.plan(2);

  var ma = MA(5000);
  var now = Date.now();
  ma.push(now, 0);
  ma.push(now + 1000, 1);
  ma.push(now + 2000, 2);
  ma.push(now + 3000, 3);
  ma.push(now + 3000, 4);

  var v = ma.variance();
  t.ok(v > 3.56);
  t.ok(v < 3.57);
});

test('variance works (2)', function(t) {
  t.plan(2);

  var ma = MA(5000);
  var now = Date.now();
  ma.push(now, 0);
  ma.push(now + 1000, 1);
  ma.push(now + 2000, 1);
  ma.push(now + 3000, 1);
  ma.push(now + 3000, 1);

  var v = ma.variance();
  t.ok(v > 0.4);
  t.ok(v < 0.5);
});