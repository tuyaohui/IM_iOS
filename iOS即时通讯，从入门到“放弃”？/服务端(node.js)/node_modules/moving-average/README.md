# moving-average

[![Build Status](https://travis-ci.org/pgte/moving-average.svg?branch=master)](https://travis-ci.org/pgte/moving-average)

Exponential Moving Average for Node.js.

Also suports Moving Variance.

## Install

```bash
$ npm install moving-average
```

## Use

```javascript
var timeInterval = 5 * 60 * 1000; // 5 minutes

var MA = require('moving-average');
var ma = MA(timeInterval);

setInterval(function() {
  ma.push(Date.now(), Math.random() * 500);
  console.log('moving average now is', ma.movingAverage());
  console.log('moving variance now is', ma.variance());
});
```

## License

MIT
