var PaydeskBus = require('./paydesk_bus');
var config = require('../config');
var net = require('net');
var Group = require('../models/group');

var ClientCaller = function(group, paydesk, client) {

   if (!(this instanceof ClientCaller))
    return new ClientCaller(group, paydesk, client);

  this.client = client;
  var test_client = client;
  this.paydesk = paydesk;
  this.group = group;

  this.Call = () => {
    var self = this;
    Group.findByClient(this.client).exec(function(err, group) {
      if (!group) return;
      var client = group.clients.id(self.client);
      var client_tcp_conn = net.createConnection(3131, client.ip, function() { self.OnSocketConnection(this); });
      client_tcp_conn.on('data', function(data) { self.OnSocketData(this, data); });
      client_tcp_conn.on('error', function(err) { self.OnSocketError(this , err); });
      //client_tcp_conn.on('end', function() { self.OnSocketEnd(this); });
      client_tcp_conn.on('timeout', function() { self.OnSocketTimeout(this); });
      client_tcp_conn.on('close', function(had_error) { self.OnSocketClose(this, had_error); });
    });
  };

  this.OnSocketConnection = function(socket) {

    Group.findByClient(this.client).exec((err, group) => {

      if (!group) return;

      var client = group.clients.id(this.client);
      var paydesk = group.paydesks.id(this.paydesk);

      actual_estimated_time = group.confirmed_clients == 0 ? 0 : Math.round(group.confirmed_times/group.confirmed_clients/60000);

      var call_message = JSON.stringify({
        paydesk_number: paydesk.number,
        reenqueue_count: client.reenqueue_count,
        next_estimated_time: actual_estimated_time
      }) + '\n';

      socket.write(call_message, 'UTF-8', function(err) {
        socket.setTimeout(config.call_timeout*1000);
      });
    });

  };

  this.OnSocketData = function(socket, response) {
    Group.findByClient(this.client).exec((err, group) => {

      if (!group) return;

      var client = group.clients.id(this.client);
      var paydesk = group.paydesks.id(this.paydesk);

      if (response.toString() == "call_received") {
        this.OnClientCalled(group, paydesk, client);
        socket.end();
      } else if (response.toString() == "confirm") {
        this.OnClientConfirm(group, paydesk, client);
        socket.end();
      } else if (response.toString() == "cancel") {
        this.OnClientCancel(group, paydesk, client);
        socket.end();
      } else if (response.toString() == "extend") {
        this.OnClientReenqueue(group, paydesk, client, "extend");
        socket.end();
      }

    });
  };

  this.OnClientCalled = function(group, paydesk, client, res) {
    console.log("["+Date.now()+"] CLIENT " + client.number + " HELLO!");
    client.setCalledBy(this.paydesk.number);
    paydesk.called_client = client;
    group.save((err) => {
      PaydeskBus.send(paydesk.number, "call_received");
    });
  }

  this.OnClientConfirm = function(group, paydesk, client) {
    console.log("["+Date.now()+"] CLIENT " + client.number + " RESPONSE [confirm]");
    paydesk.called_client = [];
    client.setConfirmed();
    client.remove();
    paydesk.current_client = client;
    group.save((err) => {
      PaydeskBus.send(paydesk.number, 'confirmed');
    });
  }

  this.OnClientCancel = function(group, paydesk, client) {
    console.log("["+Date.now()+"] CLIENT " + client.number + " RESPONSE [cancel]");
    paydesk.called_client = [];
    client.setCancelled();
    client.saveToHistory();
    client.remove();
    group.save((err) => {
      PaydeskBus.send(paydesk.number, 'cancelled');
    });
  };

  this.OnClientReenqueue = function(group, paydesk, client, reason) {
    console.log("["+Date.now()+"] CLIENT " + client.number + " RESPONSE [reenqueue="+ reason +"]");
    client.setReenqueued(reason);
    paydesk.called_client = [];

    if (client.hasReachedLimit()) {
      client.saveToHistory();
      client.remove();
      group.save((err) => {
        console.log("["+Date.now()+"] CLIENT " + client.number + " REACHED LIMIT");
        PaydeskBus.send(paydesk.number, 'queue_limit_reached');
      });
    } else {
      group.reenqueueClient(client);
      group.save((err) => {
        PaydeskBus.send(paydesk.number, reason);
      });
    }
  }

  this.OnSocketClose = function(socket, had_error) {
    console.log("["+Date.now()+"] SERVER SOCKET " + this.client.number + " CLOSED " + (had_error ? "WITH ERROR" : ""));
    if (had_error) {
      this.OnSocketError(socket);
    }
  }

  this.OnSocketTimeout = function(socket) {
    console.log("["+Date.now()+"] SERVER SOCKET" + this.client.number + " TIMEOUT");

    Group.findByClient(this.client).exec((err, group) => {

      if (!group) return;

      var client = group.clients.id(this.client);
      var paydesk = group.paydesks.id(this.paydesk);

      paydesk.called_client = [];
      group.save((err) => {
        this.OnClientReenqueue(group, paydesk, client, "response_timeout");
      });

      socket.end();

    });
  };

  this.OnSocketEnd = function(socket) {
    console.log("["+Date.now()+"] CLIENT SOCKET " + this.client.number + " CLOSED");

    Group.findByClient(this.client).exec((err, group) => {

      if (!group) return;

      var client = group.clients.id(this.client);
      var paydesk = group.paydesks.id(this.paydesk);

      paydesk.called_client = [];
      client.setCancelled();
      client.saveToHistory();
      client.remove();
      group.save((err) => {
        PaydeskBus.send(paydesk.number, 'cancelled');
      });
    });
  };

  this.OnSocketError = function(socket, err) {
    console.log("["+Date.now()+"] SERVER SOCKET " + this.client.number + " ERROR");

    Group.findByClient(this.client).exec((err, group) => {

      if (!group) return;

      var client = group.clients.id(this.client);
      var paydesk = group.paydesks.id(this.paydesk);

      client.setErrored(err);
      client.saveToHistory();
      client.remove();
      paydesk.called_client = [];
      group.save((err) => {
        PaydeskBus.send(paydesk.number, "error");
      });
    });
  };

};

module.exports = ClientCaller;

