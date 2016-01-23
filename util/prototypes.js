var mongoose = require('mongoose');

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
