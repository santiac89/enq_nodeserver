var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Client = require('./client');
var paydeskSchema = require('./paydesk');
var redis = require("redis").createClient();
var Schema = mongoose.Schema;

var groupSchema = Schema({
    paydesk_arrival_timeout: { type: Number, required: true , unique: false},
    name: { type: String, required: true , unique: true},
    paydesks:  [{ type: Schema.Types.ObjectId, ref: 'Paydesk' }],
    confirmed_clients:  { type: Number, default: 0 },
    confirmed_times:  { type: Number, default: 0 },
    paydesks_count:  { type: Number, default: 0 }
});

groupSchema.pre('save', function(next) {
  this.paydesks_count = this.paydesks.length;
  next();
});

groupSchema.methods.removePaydesk = function(paydesk_id) {
  var paydesk = this.paydesks.id(paydesk_id);
  paydesk.remove();
  return paydesk;
};

groupSchema.methods.clientIsUnique = function(client) {

  for (i=0; i < this.clients.length; i++) {
    if (this.clients[i].ip == client.ip || this.clients[i].hmac == client.hmac ) {
      return false;
    }
  }

  return true;
};

groupSchema.methods.removeClient = function(client, callback) {
  redis.lrem(`groups:${this._id}:clients`, `0`, client._id, callback);
}

groupSchema.methods.enqueueClient = function(client, callback) {
  redis.lpush(`groups:${this._id}:clients`, client._id, callback);
}

groupSchema.methods.getNextClientForPaydesk = function(paydesk_id, callback) {
  redis.rpoplpush(`groups:${this._id}:clients`,`paydesk:${paydesk_id}:client_called`,
    function(err, client_id) {
      if (err) return callback(err);
      Client.findOne({ _id: client_id }, callback);
    }
  );
}

groupSchema.plugin(uniqueValidator);

var Group = mongoose.model('Group', groupSchema);

Group.reset = function() {
  this.find({}).exec(function(err, groups) {

    groups.forEach((group) => {
      group.confirmed_clients = group.confirmed_times = 0;
      group.paydesks.forEach((paydesk) => {
        paydesk.called_client = paydesk.current_client = [];
        paydesk.active = false;
      });
      group.clients = [];
      group.save();
    });
  });
}

// Group.cancelClient = function(client_id, callbacks) {

//   // Client.findOne({ _id })
//   Group.findAndUpdateClient(client_id,
//     { status: "cancel", cancelled_time: Date.now() },
//     {
//       success: (client) => {

//         Group.findAndRemoveClient(client_id, {

//           success: (client) => {

//             client.saveToHistory();

//             Group.removePaydeskCalledClient(client.assigned_to, {
//               success: () => {
//                 callbacks.success(client);
//               }
//             });

//           }

//         });

//       }
//     }
//   );
// }

// Group.confirmClient = function(client_id, callbacks) {
//   Group.findAndUpdateClient(client_id,
//     { status: "confirm", confirmed_time: Date.now() },
//     {
//       success: (client) => {

//         Group.findAndRemoveClient(client_id, {

//           success: (client) => {

//             client.saveToHistory();

//             Group.setPaydeskCurrentClient(client, {
//               success: () => {
//                 callbacks.success(client);
//               }
//             });

//           }
//         });
//       }
//     }, true
//   );
// }

// Group.calledClient = function(client_id, callbacks) {
//   Group.findAndUpdateClient(client_id,
//     { status: "called", called_time: Date.now() },
//     {
//       success: (client) => {

//         Group.setPaydeskCalledClient(client, {
//           success: () => {
//             callbacks.success(client);
//           }
//         });
//       }
//     }
//   );
// }

// Group.errorClient = function(client_id, callbacks) {
//   Group.findAndUpdateClient(client_id,
//     { status: "error", errored_time: Date.now() },
//     {
//       success: (client) => {

//         Group.findAndRemoveClient(client_id, {

//           success: (client) => {

//             client.saveToHistory();

//             Group.removePaydeskCalledClient(client.assigned_to, {
//               success: () => {
//                 callbacks.success(client);
//               }
//             });
//           }
//         });
//       }
//     }
//   );
// }

// Group.reenqueueClient = function(client_id, reason, callbacks) {

//   this.findOneAndUpdate(
//     { "clients._id": client_id },
//     { $set: { "clients.$.status": reason }, $inc: { "clients.$.reenqueue_count": 1 } },
//     { new: true },
//     function(err, group) {

//     if (!group || err) {
//       if (callbacks.error) callbacks.error(err);
//       return;
//     }

//     client = group.clients.id(client_id);

//     Group.findAndRemoveClient(client._id, {

//       success: (client) => {

//         if (client.hasReachedLimit()) {

//           client.saveToHistory();

//           Group.removePaydeskCalledClient(client.assigned_to, {
//             success: () => { callbacks.limit_reached(client) }
//           });

//         } else {

//           Group.findOneAndUpdate(
//             { _id: group._id },
//             { $push: { clients: client } },
//             { new: true },
//             (err, group) => {

//               if (!group || err) {
//                 if (callbacks.error) callbacks.error(err);
//                 return;
//               }

//               callbacks.reenqueued(client);
//             }
//           );
//         }
//       }
//     });
//   });
// }

// Group.addNewClient = function(group_id, client, callbacks) {
//   this.findOneAndUpdate(
//     { _id: group_id },
//     { $push: { clients: client } },
//     { new: true },
//     function(err, group) {

//       if (!group || err) {
//         if (callbacks.error) callbacks.error(err);
//         return;
//       }

//       client = group.clients.find((current_client) => { return current_client.ip == client.ip });

//       callbacks.success(client);

//     }
//   );
// }



// Group.findPaydeskNextClient = function(paydesk_id, callbacks) {

//   this.findPaydesk(paydesk_id).exec((err, paydesks) => {

//     paydesk = paydesks[0];

//     if (!paydesk || paydesk.called_client.size > 0) {
//       callbacks.error(err);
//       return;
//     }

//     // group.getNextClient();

//     this.findOneAndUpdate(
//       {
//         _id: mongoose.Types.ObjectId(paydesk.group_id) ,
//         clients: { $elemMatch: { status: { $nin: ["calling","called","confirmed","cancelled"] } } }
//       },
//       {
//         $set: {
//           "clients.$.status": "calling",
//           "clients.$.assigned_to": paydesk.number,
//         }
//       },
//       {
//         new: true
//       }
//     ).exec(function(err, group) {

//       if (!group) {
//         callbacks.error(err);
//         return;
//       }

//       next_client = group.clients.find((client) => {
//         return client.assigned_to == paydesk.number && client.status == "calling"
//       });

//       next_client.next_estimated_time = Math.round(
//         group.confirmed_times/(group.confirmed_clients?group.confirmed_clients:1)/60000
//       );

//       callbacks.success(next_client);
//     });
//   });
// }

/*
  BASIC OPERATIONS
*/
// Group.findAndUpdateClient = function(client_id, fields, callbacks, update_times) {
//   Object.keys(fields).forEach((key) => { fields[`clients.$.${key}`] = fields[key]; delete fields[key]; });
//   this.findOneAndUpdate({ "clients._id": client_id },{ $set: fields },{ new: true }, function(err, group) {

//     if (!group || err) {
//       if (callbacks.error) callbacks.error(err);
//       return;
//     }

//     client = group.clients.id(client_id);

//     if (update_times) {
//       group.confirmed_times = (client.confirmed_time - client.enqueue_time);
//       group.confirmed_clients += 1;
//       group.save();
//     }

//     callbacks.success(client);
//   });
// }

// Group.setPaydeskCalledClient = function(client, callbacks) {
//   this.update(
//     { "paydesks.number": client.assigned_to },
//     { $set: { "paydesks.$.called_client": [client] } },
//     function(err) {

//       if (err && callbacks.error) {
//         callbacks.error(err);
//         return;
//       }

//       callbacks.success();
//     }
//   );
// }

// Group.setPaydeskCurrentClient = function(client, callbacks) {
//   this.update(
//     { "paydesks.number": client.assigned_to },
//     { $set: { "paydesks.$.current_client": [client], "paydesks.$.called_client": [] } },
//     function(err) {

//       if (err && callbacks.error) {
//         callbacks.error(err);
//         return;
//       }

//       callbacks.success();
//     }
//   );
// }

// Group.removePaydeskCalledClient = function(paydesk_number, callbacks) {
//   this.update(
//     { "paydesks.number": paydesk_number },
//     { $set: { "paydesks.$.called_client": [] } },
//     function(err) {

//       if (err && callbacks.error) {
//         callbacks.error(err);
//         return;
//       }

//       callbacks.success();
//     }
//   );
// }

// Group.findAndRemoveClient = function(client_id, callbacks) {
//   this.findOneAndUpdate(
//     { "clients._id": client_id },
//     { $pull: { clients: { _id: client_id } } },
//     { new: false },
//     function(err, group) {

//       if (!group || err) {
//         if (callbacks.error) callbacks.error(err);
//         return;
//       }

//       client = group.clients.id(client_id);
//       callbacks.success(client);
//     }
//   );
// }

// Group.findAndRemoveClientByIp = function(client_id, ip, callbacks) {
//   this.findOneAndUpdate(
//     { "clients._id": client_id, "clients.ip": ip },
//     { $pull: { clients: { _id: client_id } } },
//     { new: false },
//     function(err, group) {

//       if (!group || err) {
//         if (callbacks.error) callbacks.error(err);
//         return;
//       }

//       client = group.clients.id(client_id);
//       callbacks.success(client);
//     }
//   );
// }

// Group.findPaydesk = function(paydesk_id) {
//   return this.aggregate(
//     { $unwind: "$paydesks" },
//     { $match: { "paydesks._id": mongoose.Types.ObjectId(paydesk_id) } },
//     { $limit: 1 },
//     { $project: {
//         _id: "$paydesks._id",
//         number: "$paydesks.number",
//         current_client: "$clients.current_client",
//         called_client: "$clients.called_client",
//         group_id: "$$ROOT._id"
//       }
//     }
//   );
// }

Group.findByPaydesk = function(id, callback) {
  this.findOne({ "paydesks._id": id }, callback);
};


module.exports = Group;
