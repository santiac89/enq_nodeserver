var mongoose = require('mongoose');


// mongoose.Types.DocumentArray.prototype.last = function() {
//     return this[this.length];
// }

// mongoose.Types.DocumentArray.prototype.removeObj = function(obj) {
//   var i = this.indexOf(obj);
//   this.splice(i,1);
//   return obj;
// }

mongoose.Document.prototype.backup = function() {
  var obj = {};
  for (key in this.schema.paths) {
    if (key != '_id' && key != '__v') obj[key] = this[key];
  }
  return obj;
}

mongoose.Model.prototype.restore = function(obj) {
  for (key in this.schema.paths) {
    if (key != '_id' && key != '__v') this[key] = obj[key];
  }
}

module.exports = function() {};
