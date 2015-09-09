var event_bus = require('../util/event_bus');
var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var config = require('../config.js');
var net = require('net');

var paydeskSchema = mongoose.Schema.create({

  number: { type: Number, required: true , unique: true},
  group:  { type: Schema.Types.ObjectId, ref: 'Group' },
  current_client:  { type: Schema.Types.ObjectId , ref: 'Client' },
  estimated: Number,
  active: Boolean,

});


paydeskSchema.pre('remove', function(next){
    this.model('Group').update({_id: this.group._id },
      {$pull: {paydesks: this._id}},
      {multi: true},
      next
    );
});

paydeskSchema.methods.enqueueClient = function(client, callback) {
  this.clients.current_client = client._id;
}

paydeskSchema.methods.callClient = function(client) {

  var self = this;
  self.populate('group').execPopulate();

  var tcp_client = net.createConnection(3131, client.ip, function() {
    tcp_client.write(JSON.stringify({paydesk: self.number}));
    client.setCalled();
    client.save();
  });


  tcp_client.on('data', function(data) {

    if (data.response == 'confirm') {

      client.setConfirmed();
      client.save();
      self.enqueueClient(client);
      self.save();

      event_bus.emit('client_response', {response: 'confirmed'});

    } else {

      client.setReenqueued(data.response);

      if (client.hasReachedLimit()) {
        client.removeAndLog();
        event_bus.emit('client_response', {response: 'queue_limit_reached'});
      } else {
        client.save();
        self.group.enqueueClient(client);
        self.group.save();
        event_bus.emit('client_response', {response: 'more_time'});
      }
    }

    tcp_client.end();

  });

  tcp_client.setTimeout(config.callTimeout, function() {

    client.setReenqueued("client_response_timeout");

    if (client.hasReachedLimit()) {
        client.removeAndLog();
        event_bus.emit('client_response', {response: 'queue_limit_reached'});
    } else {
        client.save();
        self.group.enqueueClient(client);
        self.group.save();
        event_bus.emit('client_response', {response: 'response_timeout'});
    }
  });

  tcp_client.on('error', function(err) {
    client.setErrored(err);
    client.removeAndLog();
    event_bus.emit('client_response', {response: 'error'});
  });
}


var Paydesk = mongoose.model('Paydesk', paydeskSchema);

module.exports = Paydesk;
