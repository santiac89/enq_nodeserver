var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Client = require('./client');
var paydeskSchema = require('./paydesk');
var redis = require("redis").createClient();
var Schema = mongoose.Schema;

var groupSchema = Schema({
    paydesk_arrival_timeout: { type: Number, required: true , unique: false},
    name: { type: String, required: true , unique: true},
    confirmed_clients:  { type: Number, default: 0 },
    confirmed_times:  { type: Number, default: 0 }
    // paydesks_count:  { type: Number, default: 0 }
    // paydesks:  [{ type: Schema.Types.ObjectId, ref: 'Paydesk' }],
});

// groupSchema.pre('save', function(next) {
//   this.paydesks_count = this.paydesks.length;
//   next();
// });

// groupSchema.methods.removePaydesk = function(paydesk_id) {
//   var paydesk = this.paydesks.id(paydesk_id);
//   paydesk.remove();
//   return paydesk;
// };

// groupSchema.methods.clientIsUnique = function(client) {

//   for (i=0; i < this.clients.length; i++) {
//     if (this.clients[i].ip == client.ip || this.clients[i].hmac == client.hmac ) {
//       return false;
//     }
//   }

//   return true;
// };

groupSchema.methods.removeClient = function(client, callback) {
  redis.lrem(`groups:${this._id}:clients`, `0`, client._id, callback);
}

groupSchema.methods.enqueueClient = function(client, callback) {
  redis.lpush(`groups:${this._id}:clients`, client._id, callback);
}

// groupSchema.methods.getNextClientForPaydesk = function(paydesk_id, callback) {
//   redis.rpoplpush(`groups:${this._id}:clients`,`paydesk:${paydesk_id}:client_called`,
//     function(err, client_id) {
//       if (err) return callback(err);
//       Client.findOne({ _id: client_id }, callback);
//     }
//   );
// }

groupSchema.plugin(uniqueValidator);

var Group = mongoose.model('Group', groupSchema);

Group.reset = function() {
  // this.find({}).exec(function(err, groups) {

  //   groups.forEach((group) => {
  //     group.confirmed_clients = group.confirmed_times = 0;
  //     group.paydesks.forEach((paydesk) => {
  //       paydesk.called_client = paydesk.current_client = [];
  //       paydesk.active = false;
  //     });
  //     group.clients = [];
  //     group.save();
  //   });
  // });
}

Group.findByPaydesk = function(id, callback) {
  this.findOne({ "paydesks._id": id }, callback);
};


module.exports = Group;
