var PaydeskBus = require('./paydesk_bus');
var config = require('../config');
var net = require('net');

var ClientCaller = function(client, paydesk){

   if (!(this instanceof ClientCaller))
    return new ClientCaller(client, paydesk);

  this.client = client;
  this.paydesk = paydesk;

  this.OnSocketConnection = function(socket) {

    this.client.setCalled();
    this.client.save();

    socket.write(JSON.stringify({
      paydesk_number: this.paydesk.number,
      reenqueue_count: this.client.reenqueue_count
    }) + '\n');

    socket.setTimeout(config.call_timeout);

  };

  this.OnSocketData = function(socket, response) {
    console.log("DATA");
    socket.end();

    if (response == "confirm") {

      this.client.setConfirmed();
      this.client.save();
      this.paydesk.enqueueClient(this.client);
      this.paydesk.save();
      PaydeskBus.send(this.paydesk.number, 'confirmed');

    } else if (response == "cancel") {

      this.client.setCancelled();
      this.client.remove();
      PaydeskBus.send(this.paydesk.number, 'cancelled');

    } else {

      this.client.setReenqueued(response);

      if (this.client.hasReachedLimit()) {

        this.client.remove();
        PaydeskBus.send(this.paydesk.number, 'queue_limit_reached');

      } else {

        this.client.save();
        this.paydesk.group.enqueueClient(this.client);
        this.paydesk.group.save();
        PaydeskBus.send(this.paydesk.number, response);

      }
    }
  };

  this.OnSocketTimeout = function(socket) {
console.log("TIMEOUT");
    socket.end();
    this.client.setReenqueued("server_triggered_timeout");

    if (this.client.hasReachedLimit()) {

      this.client.remove();
      PaydeskBus.send(this.paydesk.number, 'queue_limit_reached');

    } else {

      this.client.save();
      this.paydesk.group.enqueueClient(this.client);
      this.paydesk.group.save();
      PaydeskBus.send(this.paydesk.number, 'response_timeout');

    }

  };

  this.OnSocketError = function(socket, err) {
    console.log("ERROR");
    this.client.setErrored(err);
    this.client.remove();
    PaydeskBus.send(this.paydesk.number, 'error');

  };

  this.OnSocketClose = function(socket, had_error) {
    console.log("CLOSE");
  }

  this.Call = function() {

    var _this = this;

    var client_tcp_conn = net.createConnection(3131, this.client.ip, function() {
      _this.OnSocketConnection(this);
    });

    client_tcp_conn.on('data', function(data) { _this.OnSocketData(this, data); });
    client_tcp_conn.on('error', function(err) { _this.OnSocketError(this , err); });
    client_tcp_conn.on('timeout', function() { _this.OnSocketTimeout(this); });
    client_tcp_conn.on('close', function(had_error) { _this.OnSocketClose(this, had_error); });

  };

};

module.exports = ClientCaller;

