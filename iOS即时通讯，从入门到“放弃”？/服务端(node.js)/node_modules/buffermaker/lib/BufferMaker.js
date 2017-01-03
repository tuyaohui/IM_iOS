var Long = require('long');


var BufferMaker = function(){
  this.plan = [];
};

var types = {"UInt8" : { bytes : 1},
              "Int8" : { bytes : 1},
              "Int16BE" : { bytes : 2},
              "Int32BE" : { bytes : 4},
              "Int16LE" : { bytes : 2},
              "Int32LE" : { bytes : 4},
              "UInt16BE" : { bytes : 2},
              "UInt32BE" : { bytes : 4},
              "FloatLE" : { bytes : 4},
              "DoubleLE" : { bytes: 8},
              "FloatBE" : { bytes : 4},
              "DoubleBE" : { bytes : 8},
              "UInt16LE" : { bytes : 2},
              "UInt32LE" : { bytes : 4},
              "Int64BE" : { bytes : 8},
              "string" : {}
            };

// create methods for each type
function addTypeMethod(type){
  BufferMaker.prototype[type] = function(val){
    this.plan.push({ type : type, value : val});
    return this;
  };
}

for(var type in types){
  addTypeMethod(type);
}


BufferMaker.prototype.make = function(){
  var bytecount = 0;
  var offset = 0;
  var item;
  var i, j = 0;
  for(i = 0; i < this.plan.length; i++){
    item = this.plan[i];
    if (item.type === 'string'){
      if (Buffer.isBuffer(item.value)){
        bytecount += item.value.length;
      } else {
        bytecount += Buffer.byteLength(item.value);
      }
    } else {
      bytecount += types[item.type].bytes;
    }
  }
  var buffer = new Buffer(bytecount);
  for(i = 0; i < this.plan.length; i++){
    item = this.plan[i];
    switch(item.type){
      case "Int64BE":
        var longVal = Long.fromString(item.value  + "");
        buffer.writeInt32BE(longVal.getHighBits(), offset); //write the high order bits (shifted over)
        buffer.writeInt32BE(longVal.getLowBits(), offset + 4); //write the low order bits
        offset += 8;
        break;
      case "string": 
        if (typeof item.value === 'string'){
          buffer.write(item.value, offset);
          offset += Buffer.byteLength(item.value);
        } else {
          item.value.copy(buffer, offset, 0);
          offset += item.value.length;
        }

        break;
      default :
        buffer['write' + item.type](item.value, offset);
        offset += types[item.type].bytes;
    }
  }
  return buffer;

};

module.exports = BufferMaker;
