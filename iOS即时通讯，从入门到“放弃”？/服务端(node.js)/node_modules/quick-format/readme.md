# quick format

Solves a problem with util.format

## usage

```js
var format = require('quick-format')
var options = {lowres: false} // <--default
format(['hello %s %j %d', 'world', {obj: true}, 4, {another: 'obj'}], options)
```

## options

### lowres

Passing an options object with `lowres: true` will cause quick-format any object with a circular as a string with the value '"[Circular]"'. The default behaviour is to label
circular references in an object, instead of abandoning the entire object. Naturally, 
`lowres` is a faster mode, and assumes you have made the decision to ensure the objects
you're passing have no circular references.

## caveats

We use `JSON.stringify` instead of `util.inspect`, this means object
methods (functions) *will not be serialized*.

##  util.format

In `util.format` for Node 5.9, performance is significantly affected
when we pass in more arguments than interpolation characters, e.g

```js
util.format('hello %s %j %d', 'world', {obj: true}, 4, {another: 'obj'})
```

This is mostly due to the use of `util.inspect`. Use `JSON.stringify`
(safely) instead which is significantly faster. 

It also takes an array instead of arguments, which helps us 
avoid the use of `apply` in some cases.

Also - for speed purposes, we ignore symbol.

## Benchmarks

Whilst exact matching of objects to interpolation characters is slower,
the case of additional objects is 3x faster. Further, using `lowres` mode
brings us closer to `util.inspect` speeds.

```
util*100000: 205.978ms
quickLowres*100000: 236.337ms
quick*100000: 292.018ms
utilWithTailObj*100000: 1054.592ms
quickWithTailObjLowres*100000: 267.992ms
quickWithTailObj*100000: 343.048ms
util*100000: 212.011ms
quickLowres*100000: 226.441ms
quick*100000: 296.600ms
utilWithTailObj*100000: 1020.195ms
quickWithTailObjLowres*100000: 267.331ms
quickWithTailObj*100000: 343.867ms
```

## Acknowledgements

Sponsored by nearForm
