var mongoose = require('mongoose');
var config = require('../config');

var clientSchema = mongoose.Schema.create({
  number:  { type: Number, required: false , unique: true},
  hmac:  { type: String, required: true , unique: true},
  ip:  { type: String, required: true , unique: true},
  reenqueue_count: { type: Number, default: 0 },
  enqueue_time: Number,
  called_time: Number,
  exit_time: Number,
  status: { type: String, default: "idle" },
});

var clientHistorySchema = mongoose.Schema.create({
  number:  { type: Number, required: false },
  hmac:  { type: String, required: true },
  ip:  { type: String, required: true },
  reenqueue_count: { type: Number },
  enqueue_time: Number,
  called_time: Number,
  exit_time: Number,
  status: { type: String },
  _errors: String
});

/*
  If client removed, remove it also from paydesks and groups
*/
clientSchema.pre('remove', function(next) {

    this.model('Paydesk').update({
      current_client: this._id
    },
    {
      current_client: null
    },
    {
      multi: true
    },
    this.model('Group').update({
      clients: {
        $in: [ this._id ]
      }
    },
    { $pull:
      {
        clients: this._id
      }
    },
    next));
});

clientSchema.methods.setReenqueued = function(reason) {
  this.reenqueue_count++;
  this.status = reason;
  return this;
}

clientSchema.methods.setConfirmed = function() {
  this.status = "confirmed";
  return this;
}

clientSchema.methods.setCalled = function() {
  this.status = 'called';
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
  var ClientHistory = mongoose.model('ClientHistory', clientHistorySchema);
  var historical = new ClientHistory();
  historical.restore(this.backup());
  historical.save(function(err) { console.log(err) });
  return historical;
}

clientSchema.methods.removeAndLog = function() {
  this.saveToHistory();
  this.remove();
}

var Client = mongoose.model('Client', clientSchema);

module.exports = Client;
