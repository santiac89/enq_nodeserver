var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var config   = require('../config');

var eventSchema = Schema({
  name:    { type: String, required: true },
  app:     { type: String, required: true },
  client:  { type: Schema.Types.ObjectId, ref: 'Client' },
  payload: { type: Schema.Types.Mixed },

  issued_at:  { type: Date, default: function() { return Date.now() }},
  created_at: { type: Date, default: function() { return Date.now() }}
});

var Event = mongoose.model('Event', eventSchema);

module.exports = Event;

// To be moved elsewhere
var Emitter = {
  createEvent: function(eventName, client, payload) {
    event = new Event({ name: eventName, client: client});

    if (payload) {
      event.payload = payload;
    }

    event.save();
  },

  clientConfirm: function(client, paydesk) {
    this.createEvent("client_confirm", client, {
      paydesk_id:     paydesk._id,
      paydesk_number: paydesk.number
    });
  },
  clientCancel: function(client, paydesk) {
    this.createEvent("client_cancel", client, {
      paydesk_id:     paydesk._id,
      paydesk_number: paydesk.number
    });
  },
  clientCalled: function(client, paydesk) {
    this.createEvent("client_called", client, {
      paydesk_id:     paydesk._id,
      paydesk_number: paydesk.number
    });
  },

  clientRemovedFromPaydesk: function(client, paydesk, reason) {
    this.createEvent("client_removed_from_paydesk", client, {
      paydesk_id:     paydesk._id,
      paydesk_number: paydesk.number,
      reason: reason
    });
  },
  clientReenqueued: function(client, paydesk, reason) {
    this.createEvent("client_reenqueued", client, {
      paydesk_id:     paydesk._id,
      paydesk_number: paydesk.number,
      reason: reason
    });
  },
  clientReachedReenqueueLimit: function(client, paydesk) {
    this.createEvent("client_reached_reenqueue_limit", client, {
      paydesk_id:     paydesk._id,
      paydesk_number: paydesk.number
    });
  }
}

module.exports = Emitter;
