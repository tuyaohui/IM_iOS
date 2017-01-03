var hasher = require("./")();
var expect = require("chai").expect;

describe("hasher", function() {

  it("should generate an hash from a password twice", function(done) {
    var opts = {
      password: "helloworld"
    };
    hasher(opts, function(err, pass, salt, hash) {
      opts.salt = salt;
      hasher(opts, function(err, pass, salt, hash2) {
        expect(hash2).to.be.equal(hash);
        done();
      });
    });
  });

  it("should generate a password if one is not present", function(done) {
    var opts = {
      password: "helloworld"
    };
    hasher(opts, function(err, pass, salt, hash) {
      expect(pass).to.be.a('string');
      done();
    });
  });

  it("should generate an hash from a password twice", function(done) {
    var opts = {
      password: "helloworld",
      salt: "PvZ+QeDTsLo8+Jqgwqre90rSpxDhvWvvE4uiOnzQ2a1HhjEQxoIDItMIJ3jk+MrQI+hVQlUI9lRSw4qNQxNCzA=="
    };
    hasher(opts, function(err, pass, salt, hash) {
      expect(hash).to.equal("2ukNWdhk271vZcyKl4/iKLaw6EZ8/gZrv56/b2MXHMJSN+9522FvfryTsJsAWlXRncYDiQMudckbsJ6BfSGi7FeUwcuseO4rzTwk3tnNjzxjmayqLyCzuwNF5uS7aAwAX4878CesxlZds7mSRbZ3fYqoJzGjL1pmB8RA9lLX+DQ=");
      done()
    });
  });
});
