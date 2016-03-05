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
  this.paydesk = paydesk_number;
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

var Client = mongoose.model('Client', clientSchema);

Client.findOrCreate = function(client_info, callback) {
  this.findOne({ hmac: client_info.hmac }, function(err, client) {

    if (err) callback(err);

    if (!client) {
      client = new Client(client_info);
      client.save(callback);
    } else {
      client.ip = client_info.ip
      client.number - client_info.number;
      client.save(callback)
    }
  });
}

module.exports = Client;
