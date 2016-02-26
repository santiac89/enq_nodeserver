var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var redis = require('redis').createClient();
var Client = require('./client');

var paydeskSchema = Schema({
  number: { type: Number, required: true },
  // current_client:  [clientSchema],
  // called_client:  [clientSchema],
  active: { type: Boolean, default: false },
  group:  { type: Schema.Types.ObjectId, ref: 'Group' }

});

paydeskSchema.methods.fetchNextClient = function(callback) {
  redis.rpoplpush(`groups:#{this.group._id}:clients paydesk:#{this._id}:client_called`,
    function(err, client_id) {
      if (err) return callback(err);
      Client.findOne({ _id: client_id }, callback);
    }
  );
}

paydeskSchema.methods.removeCalledClient = function(client, callback) {
  redis.lrem(`paydesks:${this._id}:client_called`,`0` ,`${client._id}`, callback);
}

var Paydesk = mongoose.model('Paydesk', paydeskSchema);

module.exports = Paydesk;
