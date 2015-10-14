var events = require('events');
var event_bus = new events.EventEmitter();

var PaydeskBus = {

  send: function(paydesk_number, message_string) {
    event_bus.emit('client_response', { message: message_string, paydesk_number: paydesk_number });
  },

  on: function(event, callback) {
    event_bus.on(event, callback);
  },

  remove: function(event, callback) {
    event_bus.removeListener(event, callback);
  }

};

module.exports = PaydeskBus;
