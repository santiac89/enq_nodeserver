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
});

groupSchema.methods.removeClient = function(client, callback) {
  redis.lrem(`groups:${this._id}:clients`, `0`, client._id, callback);
}

groupSchema.methods.enqueueClient = function(client, callback) {
  redis.lpush(`groups:${this._id}:clients`, client._id, callback);
}

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

module.exports = Group;
