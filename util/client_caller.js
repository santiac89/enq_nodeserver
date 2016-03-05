var PaydeskBus = require('./paydesk_bus');
var config = require('../config');
var net = require('net');
var ClientManager = require('./client_manager');
var Emitter = require('../models/event');

var ClientCaller = function(client, paydesk, group) {

  if (!(this instanceof ClientCaller))
    return new ClientCaller(client, paydesk, group);

  this.client  = client;
  this.paydesk = paydesk;
  this.group   = group;

  this.manager = ClientManager(client, paydesk, group);

  this.Call = () => {
    var self = this;
    var client_tcp_conn = net.createConnection(3131, this.client.ip, function() { self.OnSocketConnection(this); });
    client_tcp_conn.on('data', function(data) { self.OnSocketData(this, data); });
    client_tcp_conn.on('error', function(err) { self.OnSocketError(this , err); });
    client_tcp_conn.on('timeout', function() { self.OnSocketTimeout(this); });
    client_tcp_conn.on('close', function(had_error) { self.OnSocketClose(this, had_error); });
    client_tcp_conn.on('end', function() { self.OnSocketEnd(this); });
  };

  this.OnSocketConnection = (socket) => {

      var call_message = JSON.stringify({
        paydesk_number: this.paydesk.number,
        reenqueue_count: this.client.reenqueue_count,
        next_estimated_time: 0
      }) + '\n';

      socket.write(call_message, 'UTF-8', (err) => {
        if (err) return console.log(err);
        console.log(`[${Date.now()}] SERVER HELLO TO CLIENT ${this.client.number}`);
        socket.setTimeout(config.call_timeout*1000);
      });

  };

  this.OnSocketData = function(socket, response) {

    switch (response.toString()) {
      case "call_received":
        this.manager.OnClientCalled();
      break;
      case "confirm":
        this.manager.OnClientConfirm();
      break;
      case "cancel":
        this.manager.OnClientCancel();
      break;
      case "extend":
        this.manager.OnClientReenqueue("extend");
      break;
    }


  };

  this.OnSocketClose = function(socket, had_error) {
    console.log(`[${Date.now()}] SERVER SOCKET ${this.client.number} CLOSED ${had_error ? '(ERROR)' : ''}`);

  }

  this.OnSocketTimeout = function(socket) {
    console.log(`[${Date.now()}] SERVER SOCKET ${this.client.number} TIMEOUT`);
    socket.end();
    this.manager.OnClientReenqueue("response_timeout");
  };

  this.OnSocketError = function(socket, err) {
    console.log(`[${Date.now()}] SERVER SOCKET ${this.client.number} ERROR ${err}`);

    Emitter.createEvent('socket_closed_with_error', this.client , err);

    if (err.code == 'ECONNREFUSED') {
      Emitter.clientUnreachable(this.client, this.paydesk, err);
    }
     // log other errors
    PaydeskBus.send(this.paydesk.number, "error");
  };

  this.OnSocketEnd = function(socket, err) {
    console.log(`[${Date.now()}] SERVER SOCKET ${this.client.number} END`);
  };

};

module.exports = ClientCaller;

