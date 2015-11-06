var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var clientSchema = require('./client');
var paydeskSchema = require('./paydesk');
var Schema = mongoose.Schema;

var groupSchema = Schema({
    paydesk_arrival_timeout: { type: Number, required: true , unique: false},
    name: { type: String, required: true , unique: true},
    paydesks:  [paydeskSchema],
    clients: [clientSchema],
    confirmed_clients:  { type: Number, default: 0 },
    confirmed_times:  { type: Number, default: 0 },
    paydesks_count:  { type: Number, default: 0 }
});

groupSchema.pre('save', function(next) {
  this.paydesks_count = this.paydesks.length;
  next();
});

groupSchema.methods.enqueueClient = function(client) {
	this.clients.push(client);
    return this;
};

groupSchema.methods.reenqueueClient = function(client) {
    var client = this.removeClient(client._id);
    this.enqueueClient(client);
    return this;
};

groupSchema.methods.removeClient = function(client_id) {
    var client = this.clients.id(client_id);
    client.remove();
    return client;
};

groupSchema.methods.removePaydesk = function(paydesk_id) {
  var paydesk = this.paydesks.id(paydesk_id);
  paydesk.remove();
  return paydesk;
};

groupSchema.methods.getNextClient = function() {

    for (i = 0;i < this.clients.length ; i++) {
      if (this.clients[i].status != 'called' && this.clients[i].status != 'calling') {
       return this.clients[i];

      }
    }

    return null;
};

groupSchema.methods.clientIsUnique = function(client) {

  for (i=0; i < this.clients.length; i++) {
    if (this.clients[i].ip == client.ip || this.clients[i].hmac == client.hmac ) {
      return false;
    }
  }

  return true;
};

groupSchema.plugin(uniqueValidator);

var Group = mongoose.model('Group', groupSchema);

Group.reset = function() {
  this.find({}).exec(function(err, groups) {

    groups.forEach((group) => {
      group.confirmed_clients = group.confirmed_times = 0;
      group.paydesks.forEach((paydesk) => {
        paydesk.called_client = paydesk.current_client = [];
      });
      group.clients = [];
      group.save();
    });
  });
}

Group.findByPaydesk = function(id) {
    return this.findOne({ "paydesks._id": id });
};

Group.findByPaydeskNumber = function(number) {
    return this.findOne({ "paydesks.number": number });
};

Group.updateClient = function(client_id, fields, callback) {
  Object.keys(fields).forEach((key) => { fields[`clients.$.${key}`] = fields[key]; delete fields[key]; });
  this.update({ "clients._id": client_id },{ $set: fields },callback);
}

Group.removeClient = function(client_id) {
  this.update({}, { $pull: { clients: { _id: client_id } } });
}

Group.getPaydeskNextClient = function(paydesk_id, callbacks) {

  this.getPaydesk(paydesk_id).exec((err, paydesks) => {

    paydesk = paydesks[0];

    if (!paydesk || paydesk.called_client.size == 0) {
      callbacks.error(err);
      return;
    }

    this.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(paydesk.group_id) ,
        clients: { $elemMatch: { status: { $nin: ["calling","called","confirmed","cancelled"] } } }
      },
      {
        $set: {
          "clients.$.status": "calling",
          "clients.$.assigned_to": paydesk.number,
        }
      },
      {
        new: true
      }
    ).exec(function(err, group) {

      if (!group) {
        callbacks.error(err);
        return;
      }

      next_client = group.clients.find((client) => {
        return client.assigned_to == paydesk.number && client.status == "calling"
      });

      next_client.next_estimated_time = Math.round(
        group.confirmed_times/(group.confirmed_clients?group.confirmed_clients:1)/60000
      );

      callbacks.success(next_client);

    });

  });

  // return this.aggregate(
  //   { $unwind: "$paydesks" },
  //   { $match: { "paydesks._id": paydesk_id , "paydesks.called_client": [] } },
  //   { $unwind: "$clients" },
  //   { $match: { "clients.status": { $nin: ["calling","called"] } } },
  //   { $limit: 1 },
  //   { $project: {
  //       _id: "$clients._id",
  //       number: "$clients.number",
  //       ip: "$clients.ip",
  //       paydesk_number: "$paydesks.number",
  //       reenqueue_count: "$clients.reenqueue_count",
  //       estimated_time: { $divide: [ {$divide: ["$confirmed_times", "$confirmed_clients"]}, 60000] }
  //     }
  //   }
  // );
}

Group.getPaydesk = function(paydesk_id) {
  return this.aggregate(
    { $unwind: "$paydesks" },
    { $match: { "paydesks._id": mongoose.Types.ObjectId(paydesk_id) } },
    { $limit: 1 },
    { $project: {
        _id: "$paydesks._id",
        number: "$paydesks.number",
        current_client: "$clients.current_client",
        called_client: "$clients.called_client",
        group_id: "$$ROOT._id"
      }
    }
  );
}

Group.getClient = function(client_id) {
  return this.aggregate(
    { $unwind: "$clients" },
    { $match: { "clients._id": client_id } },
    { $project: { _id: "$clients._id" , number: "$clients.number" } }
  );
}

Group.setCalledClient = function(client) {
  this.update(
    { "paydesks.number": client.paydesk_number, "clients._id": client._id },
    { $set: {
        "clients.$.status": "called",
        "clients.$.called_by": client.paydesk_number,
        "clients.$.called_time": Date.now(),
        "paydesks.$.current_client": 0,
        "paydesks.$.called_client": client._id
      }
    }
  ).exec(function() {
    //SAVE TO HISTORY
  });
}

Group.setConfirmedClient = function(client) {
  this.update(
    { "paydesks.number": client.paydesk_number, "clients._id": client._id },
    { $set: {
        "clients.$.status": "confirmed",
        "clients.$.confirmed_time": Date.now(),
        "paydesks.$.current_client": client._id,
        "paydesks.$.called_client": 0
      }
    }
  );
}

Group.setCancelledClient = function(client) {
  this.update(
    { "paydesks.number": client.paydesk_number, "clients._id": client._id },
    { $set: {
        "clients.$.status": "cancelled",
        "clients.$.cancelled_time": Date.now(),
        "paydesks.$.called_client": 0
      }
    }
  );
}

Group.setReenqueuedClient = function(client, reason) {
  this.update(
    { "paydesks.number": client.paydesk_number, "clients._id": client._id },
    { $set: {
        "clients.$.status": reason,
        "paydesks.$.called_client": 0
      },
      $inc: {
        "clients.$.reenqueue_count": 1
      }
    }
  );
}

Group.getAllPaydesks = function() {

    this.find({},'paydesks').exec(function(err, groups) {

        var paydesks = [];

        for (i=0; i < groups.length; i++) {
          for (o=0; o < groups[i].paydesks.length; o++) {

            paydesks.push(groups[i].paydesks[o]);

          }
        }

    });

};

Group.findByClient = function(id) {
    return this.findOne({ clients: { $elemMatch: { _id: id } }});
};

module.exports = Group;
