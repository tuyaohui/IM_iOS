var exp = Math.exp;
var pow = Math.pow;
var E = Math.E;

function squared(n) {
  return Math.pow(n, 2);
}

exports =
module.exports =
function MovingAverage(timespan) {
  if (typeof timespan != 'number')
    throw new Error('must provide a timespan to the moving average constructor');

  if (timespan <= 0)
    throw new Error('must provide a timespan > 0 to the moving average constructor');

  var ma;     // moving average
  var v = 0;  // variance
  var nSamples = 0;

  var previousTime;
  var ret = {};


  function alpha(t, pt) {
    return 1 - (exp(- (t - pt) / timespan));
  }


  ret.push =
  function push(time, value) {
    nSamples++;
    if (previousTime) {

      // calculate moving average
      var a = alpha(time, previousTime);
      var previousMa = ma;
      ma = a * value + (1 - a) * ma;

      // calculate variance
      v = v + (value - previousMa) * (value  - ma);

    } else {
      ma = value;
    }
    previousTime = time;
  };


  // Exponential Moving Average

  ret.movingAverage =
  function movingAverage() {
    return ma;
  };


  // Variance
  ret.variance =
  function variance() {
    return v / nSamples;
  };

  return ret;

};
