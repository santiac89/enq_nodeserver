var event_bus = require('./event_bus');
var config = require('../config');
var net = require('net');

var ClientCaller = {

  client: undefined,
  paydesk: undefined,

  OnSocketConnection: function() {
    console.log("CONNECTION");
    this.write(JSON.stringify({paydesk: this.paydesk.number, call_timeout: config.call_timeout }));
    this.client.setCalled();
    this.client.save();
    this.setTimeout(config.call_timeout);

  },

  OnSocketData: function(data) {

    if (data.response == 'confirm') {

      this.client.setConfirmed();
      this.client.save();
      this.paydesk.enqueueClient(this.client);
      this.paydesk.save();

      event_bus.emit('client_response', { response: 'confirmed' });

    } else {

      this.client.setReenqueued(data.response);

      if (this.client.hasReachedLimit()) {

        this.client.removeAndLog();
        event_bus.emit('client_response', { response: 'queue_limit_reached' });

      } else {

        this.client.save();
        this.paydesk.group.enqueueClient(this.client);
        this.paydesk.group.save();
        event_bus.emit('client_response', { response: data.response });

      }
    }

    this.end();

  },

  OnSocketTimeout: function() {

    console.log("TIMEOUT");
    this.client.setReenqueued("client_response_timeout");

    if (this.client.hasReachedLimit()) {

      this.client.removeAndLog();
      event_bus.emit('client_response', { response: 'queue_limit_reached' });

    } else {

      this.client.save();
      this.paydesk.group.enqueueClient(this.client);
      this.paydesk.group.save();
      event_bus.emit('client_response', { response: 'response_timeout' });

    }

  },

  OnSocketError: function(err) {

    console.log("ERROR");
    this.client.setErrored(err);
    this.client.removeAndLog();
    event_bus.emit('client_response', { response: 'error' });

  },

  Call: function(paydesk, client) {

    this.paydesk = paydesk;
    this.client = client;

    var client_tcp_conn = net.createConnection(3131, client.ip);

    client_tcp_conn.on('connection', this.OnSocketConnection);
    client_tcp_conn.on('data', this.OnSocketData);
    client_tcp_conn.on('error', this.OnSocketError);
    client_tcp_conn.on('timeout', this.OnSocketTimeout);

  }

};

module.exports = ClientCaller;

