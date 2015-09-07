var event_bus = require('../util/event_bus');
var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var config = require('../config.js');
var net = require('net');

var paydeskSchema = mongoose.Schema({

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

paydeskSchema.methods.callClient = function(client) {

  var self = this;

  var tcp_client = net.createConnection(3131, client.ip, function() {
    tcp_client.write(JSON.stringify({paydesk: self.number}));
    client.setCalled().save();
  });


  tcp_client.on('data', function(data) {

    if (data.response == 'confirm') {

      self.enqueueClient(client);//.save(function(p) {
      client.setConfirmed();
      self.save();
      client.save();
      event_bus.emit('client_response', client);

    } else {

      self.group.enqueueClient(client);
      client.setReenqueued(data.response);
      self.group.save();
      client.save();
      event_bus.emit('client_response', client);

    }

    tcp_client.end();

  });

  tcp_client.setTimeout(config.callTimeout, function() {

    if (self.group == undefined) self.populate('group').exec();

    self.group.enqueueClient(client);
    client.setReenqueued("client_response_timeout"); //,function() {
    self.group.save();
    client.save();
    event_bus.emit('client_response', client);
    //   });
    // });
  });

  tcp_client.on('error', function(err) {
    console.log(err)
    client.setCancelled();
    client.addToHistory();
    client.remove();
    event_bus.emit('client_response', client);

  });
}

paydeskSchema.methods.enqueueClient = function(client, callback) {
  // if (typeof callback === 'undefined') { callback = function() {}; };
  this.clients.current_client = client._id;
  // this.save(function(err) {
    // if (!err) callback();
  // });
}

var Paydesk = mongoose.model('Paydesk', paydeskSchema);

module.exports = Paydesk;
