# pbkdf2-password&nbsp;[![Build Status](https://travis-ci.org/mcollina/pbkdf2-password.svg?branch=master)](https://travis-ci.org/mcollina/pbkdf2-password)

Easy salt/password creation for Node.js, extracted from
[Mosca](http://npm.im/mosca).

Usage
-----

```js
var bkfd2Password = require("pbkdf2-password");
var hasher = bkfd2Password();
var assert = require("assert");
var opts = {
  password: "helloworld"
};

hasher(opts, function(err, pass, salt, hash) {
  opts.salt = salt;
  hasher(opts, function(err, pass, salt, hash2) {
    assert.deepEqual(hash2, hash);

    // password mismatch
    opts.password = "aaa";
    hasher(opts, function(err, pass, salt, hash2) {
      assert.notDeepEqual(hash2, hash);
      console.log("OK");
    });
  });
});
```

API
---

* <a href="#build"><code>bkfd2Password<b></b></code></a>
* <a href="#hasher"><code><b>hasher()</b></code></a>

<a name="build">
### bkfd2Password(options)

Creates a new [hasher](#hasher) functions, with the specified options.

Options:

 * `saltLength`, the length of the random salt
 * `iterations`, number of pbkdf2 iterations
 * `keyLength`, the length of the generated keys
 * `digest`, the digest algorithm, default `'sha1'`

<a name="hasher">
### hasher(opts, function(err, pass, salt, hash))

Hash a password, using a hash and the pbkd2
crypto module.

Options:
 - `password`, the password to hash.
 - `salt`, the salt to use, as a base64 string.

If the `password` is left undefined, a new
10-bytes password will be generated, and converted
to base64.

If the `salt` is left undefined, a new salt is generated.

The callback will be called with the following arguments:
 - the error, if something when wrong.
 - the password.
 - the salt, encoded in base64.
 - the hash, encoded in base64.

License
-------

MIT
