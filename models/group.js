var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var clientSchema = require('./client');
var paydeskSchema = require('./paydesk');
var Schema = mongoose.Schema;

var groupSchema = mongoose.Schema({
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
      if (this.clients[i].status != 'called') {
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

Group.findByPaydesk = function(id) {
    return this.findOne({ paydesks: { $elemMatch: { _id: id } }});
};

Group.findByPaydeskNumber = function(number) {
    return this.findOne({ paydesks: { $elemMatch: { number: number } }});
};

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
