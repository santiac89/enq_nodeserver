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

var Paydesk = mongoose.model('Paydesk', paydeskSchema);

module.exports = Paydesk;
