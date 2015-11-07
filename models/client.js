var mongoose = require('mongoose');
var config = require('../config');
var ClientHistory = require('./client_history');

var clientSchema = mongoose.Schema({
  number:  { type: Number, required: false },
  hmac:  { type: String, required: true },
  ip:  { type: String, required: true },
  reenqueue_count: { type: Number, default: 0 },
  enqueue_time: { type: Number, default: 0 },
  called_time: { type: Number, default: 0 },
  cancelled_time: { type: Number, default: 0 },
  errored_time: { type: Number, default: 0 },
  confirmed_time: { type: Number, default: 0 },
  status: { type: String, default: "idle" },
  assigned_to: Number
});

clientSchema.methods.setReenqueued = function(reason) {
  this.reenqueue_count++;
  this.status = reason;
  return this;
}

clientSchema.methods.setConfirmed = function() {
  this.status = "confirmed";
  this.confirmed_time = Date.now();
  return this;
}

clientSchema.methods.setCalledBy = function(paydesk_number) {
  this.status = 'called';
  this.called_by = paydesk_number;
  this.called_time = Date.now();
  return this;
}

clientSchema.methods.setErrored = function(err) {
  this.status = 'errored';
  this.errored_time = Date.now();
  this._errors = JSON.stringify(err);
  return this;
}

clientSchema.methods.setCancelled = function() {
  this.status = 'cancelled';
  this.cancelled_time = Date.now();
  return this;
}

clientSchema.methods.hasReachedLimit = function() {
  return this.reenqueue_count > config.reenqueue_limit;
}

clientSchema.methods.saveToHistory = function() {
  var historical = new ClientHistory();
  historical.restore(this.backup());
  historical.removed_time = Date.now();
  historical.save();
  return historical;
}

module.exports = clientSchema;
