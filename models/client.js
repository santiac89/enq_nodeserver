var mongoose = require('mongoose');
var config = require('../config');
var uniqueValidator = require('mongoose-unique-validator');
var ClientHistory = require('./client_history');

var clientSchema = mongoose.Schema({
  number:  { type: Number, required: false },
  hmac:  { type: String, required: true, unique: true },
  ip:  { type: String, required: true, unique: true },
  reenqueue_count: { type: Number, default: 0 },
  enqueue_time: { type: Number, default: 0 },
  called_time: { type: Number, default: 0 }, // TODO Cambiar a array de llamados
  cancelled_time: { type: Number, default: 0 },
  errored_time: { type: Number, default: 0 },
  confirmed_time: { type: Number, default: 0 },
  status: { type: String, default: "idle" },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  paydesk: { type: mongoose.Schema.Types.ObjectId, ref: 'Paydesk' }
});

clientSchema.plugin(uniqueValidator);

clientSchema.methods.reenqueue = function(reason, callback) {
  this.reenqueue_count++;
  this.paydesk = undefined;
  this.status = reason;
  this.save(callback || () => {});
  return this;
}

clientSchema.methods.confirm = function(callback) {
  this.status = "confirmed";
  this.confirmed_time = Date.now();
  return this;
}

clientSchema.methods.setCalledBy = function(paydesk_number, callback) {
  this.status = 'called';
  this.paydesk = paydesk_number;
  this.called_time = Date.now();
  this.save(callback || () => {});
  return this;
}

clientSchema.methods.error = function(err, callback) {
  this.status = 'errored';
  this.errored_time = Date.now();
  this._errors = JSON.stringify(err);
  this.save(callback || () => {});
  return this;
}

clientSchema.methods.cancel = function(callback) {
  this.status = 'cancelled';
  this.cancelled_time = Date.now();
  this.save(callback || () => {});
  return this;
}

clientSchema.methods.leave = function(callback) {
  this.status = 'idle';
  this.reenqueue_count = 0;
  this.group = undefined;
  this.paydesk = undefined;
  this.number = undefined;
  this.save(callback || () => {});
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

clientSchema.methods.arrivalTime = function(offset_in_seconds) {
  // use es6 default parameters (https://babeljs.io/docs/learn-es2015/#default-rest-spread)
  if (!offset_in_seconds) offset_in_seconds = 60;
  return this.confirmed_time + (offset_in_seconds * 1000);
}

clientSchema.methods.remainingSecondsToArrive = function(test_time, offset_in_seconds) {
  if (!offset_in_seconds) offset_in_seconds = 60;
  return Math.round((this.arrivalTime(offset_in_seconds) - test_time)/1000);
}

clientSchema.methods.toleranceCallTime = function(offset_in_seconds) {
  if (!offset_in_seconds) offset_in_seconds = 60;
  return this.called_time + (offset_in_seconds * 1000);
}

clientSchema.methods.remainingSecondsToReenqueue = function(test_time, offset_in_seconds) {
  if (!offset_in_seconds) offset_in_seconds = 60;
  return Math.round((this.toleranceCallTime(offset_in_seconds) - test_time)/1000);
}

var Client = mongoose.model('Client', clientSchema);

Client.findOrCreate = function(client_info, callback) {
  this.findOne({ hmac: client_info.hmac }, function(err, client) {

    if (err) callback(err);

    if (!client) {
      client = new Client(client_info);
      client.save(callback);
    } else {
      client.ip = client_info.ip
      client.number = client_info.number;
      client.save(callback)
    }
  });
}

exports.Model = Client;
exports.Schema = clientSchema;
