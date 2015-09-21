var mongoose = require('mongoose');
var config = require('../config');

var clientHistorySchema = mongoose.Schema.create({
  number:  { type: Number, required: false },
  hmac:  { type: String, required: true },
  ip:  { type: String, required: true },
  reenqueue_count: { type: Number },
  enqueue_time: Number,
  called_time: Number,
  cancelled_time: Number,
  errored_time: Number,
  confirmed_time: Number,
  status: { type: String },
  called_by: Number,
  _errors: String
});

var ClientHistory = mongoose.model('ClientHistory', clientHistorySchema);

module.exports = ClientHistory;
