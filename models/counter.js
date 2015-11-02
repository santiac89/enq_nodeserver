var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var counterSchema = Schema({

  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }

});

var Counter = mongoose.model('Counter', counterSchema);

Counter.getNextSequence = function(name, callback) {
    this.findOneAndUpdate(
      { _id: name },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    ).exec(callback);

};

Counter.reset = function(name) {
    this.findOneAndUpdate(
      { _id: name },
      { $set: { seq: 0 } },
      { new: true, upsert: true }
    ).exec();

};

module.exports = Counter;
