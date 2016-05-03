var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var redis = require('redis').createClient();
var Client = require('./client').Model;

var paydeskSchema = Schema({
  number: { type: Number, required: true },
  active: { type: Boolean, default: false },
  group:  { type: Schema.Types.ObjectId, ref: 'Group' },
  confirmed_client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  called_client:    { type: mongoose.Schema.Types.ObjectId, ref: 'Client' }
});

paydeskSchema.methods.fetchNextClientFromQueue = function(callback) {
  redis.rpop(`groups:${this.group._id}:clients`, (err, client_id) => {
    if (err) return callback(err);
    Client.findOneAndUpdate(
      { _id: client_id },
      { $set: { paydesk: this._id } },
      { new: true },
      callback
    );
  });
}

paydeskSchema.methods.fetchNextClient = function(callback) {
  this.fetchNextClientFromQueue((err, client) => {
    if (err) return callback(err);

    this.called_client = client;
    this.save();

    callback(err, client);
  });
}

paydeskSchema.methods.waitForClient = function(client, callback) {
  this.confirmed_client = client;
  this.called_client = null; // remove called client
  this.save(callback || () => {});
}

paydeskSchema.methods.removeCalledClient = function(client, callback) {
  this.called_client = null;
  this.save(callback || () => {});
}

var Paydesk = mongoose.model('Paydesk', paydeskSchema);

module.exports = Paydesk;
