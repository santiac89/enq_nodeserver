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

// module.exports = Event;

// To be moved elsewhere
var Emitter = {
  createEvent: function(eventName, client, payload) {
    var event = new Event({ name: eventName, client: client});

    if (payload) event.payload = payload;

    event.save();
  },
  createEventWithPaydesk: function(eventName, client, paydesk, payload) {
    if (!payload) payload = {};

    payload.paydesk_id     = paydesk._id;
    payload.paydesk_number = paydesk.number;

    this.createEvent(eventName, client, payload);
  },

  clientConfirm: function(client, paydesk) {
    this.createEventWithPaydesk("client_confirm", client, paydesk);
  },
  clientCancel: function(client, paydesk) {
    this.createEventWithPaydesk("client_cancel", client, paydesk);
  },
  clientCalled: function(client, paydesk) {
    this.createEventWithPaydesk("client_called", client, paydesk);
  },

  clientRemovedFromPaydesk: function(client, paydesk, reason) {
    this.createEventWithPaydesk("client_removed_from_paydesk", client, paydesk, { reason: reason });
  },
  clientReenqueued: function(client, paydesk, reason) {
    this.createEventWithPaydesk("client_reenqueued", client, paydesk, { reason: reason });
  },
  clientReachedReenqueueLimit: function(client, paydesk) {
    this.createEventWithPaydesk("client_reached_reenqueue_limit", client, paydesk);
  },
  clientUnreachable: function(client, paydesk, error) {
    this.createEventWithPaydesk("client_unreachable", client, paydesk, {
      error_code:    error.code,
      error_message: error.message,
      error_syscall: error.syscall,
      error_address: error.address,
      error_port: error.port
    });
  }
}

module.exports = Emitter;
