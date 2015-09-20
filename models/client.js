var mongoose = require('mongoose');
var config = require('../config');
var ClientHistory = require('./client_history');

var clientSchema = mongoose.Schema.create({
  number:  { type: Number, required: false , unique: true},
  hmac:  { type: String, required: true , unique: true},
  ip:  { type: String, required: true , unique: true},
  reenqueue_count: { type: Number, default: 0 },
  enqueue_time: Number,
  called_time: Number,
  exit_time: Number,
  status: { type: String, default: "idle" },
  called_by: Number
});



clientSchema.methods.setReenqueued = function(reason) {
  this.reenqueue_count++;
  this.status = reason;
  return this;
}

clientSchema.methods.setConfirmed = function() {
  this.status = "confirmed";
  this.exit_time = Date.now();
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
  this.exit_time = Date.now();
  this._errors = JSON.stringify(err);
  return this;
}

clientSchema.methods.setCompleted = function() {
  this.status = 'completed';
  this.exit_time = Date.now();
  return this;
}

clientSchema.methods.setCancelled = function() {
  this.status = 'cancelled';
  this.exit_time = Date.now();
  return this;
}

clientSchema.methods.setReenqueueLimitReached = function() {
  this.status = 'reenqueue_limit';
  this.exit_time = Date.now();
  return this;
}

clientSchema.methods.hasReachedLimit = function() {
  return this.reenqueue_count > config.reenqueue_limit;
}

clientSchema.methods.saveToHistory = function() {
  var historical = new ClientHistory();
  historical.restore(this.backup());
  historical.save(function(err) { console.log(err) });
  return historical;
}

module.exports = clientSchema;
