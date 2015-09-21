var event_bus = require('../util/event_bus');
var mongoose = require('mongoose')
var clientSchema = require('./client');
var Schema = mongoose.Schema;


var paydeskSchema = mongoose.Schema.create({

  number: { type: Number, required: true , unique: true},
  current_client:  [clientSchema],
  estimated: Number,
  active: Boolean,

});

paydeskSchema.methods.removeClient = function() {
  return this.current_client.pop();
}

paydeskSchema.methods.addClient = function(client) {
  this.current_client.pop();
  this.current_client.push(client);
}

module.exports = paydeskSchema;
