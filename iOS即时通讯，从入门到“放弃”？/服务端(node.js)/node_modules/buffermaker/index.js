var dir = './lib/';
if (process.env.BUFFERMAKER_COVERAGE){
  dir = './lib-cov/';
}

module.exports = require(dir + 'BufferMaker');

