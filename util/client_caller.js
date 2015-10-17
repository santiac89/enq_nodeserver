var PaydeskBus = require('./paydesk_bus');
var config = require('../config');
var net = require('net');
var Group = require('../models/group');

var ClientCaller = function(group, paydesk, client) {

   if (!(this instanceof ClientCaller))
    return new ClientCaller(group, paydesk, client);

  this.client = client;
  this.paydesk = paydesk;
  this.group = group;

  this.OnSocketConnection = (socket) => {

    Group.findByClient(this.client).exec((err, group) => {

      if (!group) return;

      var client = group.clients.id(this.client);
      var paydesk = group.paydesks.id(this.paydesk);

      client.setCalledBy(this.paydesk.number);
      paydesk.called_client = client;

      group.save(function(err) {

        var call_message = JSON.stringify({
          paydesk_number: paydesk.number,
          reenqueue_count: client.reenqueue_count,
          next_estimated_time: Math.round(group.confirmed_times / (group.confirmed_clients == 0 ? 1 : group.confirmed_clients) / 60000)
        }) + '\n';

        socket.write(call_message, 'UTF-8', function(err) {
          socket.setTimeout(config.call_timeout*1000);
        });

      });
    });

  };

  this.OnSocketData = (socket, response) => {

    Group.findByClient(this.client).exec((err, group) => {

      if (!group) return;

      var client = group.clients.id(this.client);
      var paydesk = group.paydesks.id(this.paydesk);

      paydesk.called_client = [];

      console.log(response.toString());

      if (response.toString() == "confirm") {
        this.OnClientConfirm(group, paydesk, client);
      } else if (response.toString() == "cancel") {
        this.OnClientCancel(group, paydesk, client);
      } else if (response.toString() == "extend") {
        this.OnClientReenqueue(group, paydesk, client, "extend");
      }

      socket.end();

    });
  };

  this.OnSocketTimeout = (socket) => {

    Group.findByClient(this.client).exec((err, group) => {

      if (!group) return;

      var client = group.clients.id(this.client);
      var paydesk = group.paydesks.id(this.paydesk);

      paydesk.called_client = [];
      group.save();

      socket.end();

      this.OnClientReenqueue(group, paydesk, client, "response_timeout");

    });

  };

  this.OnSocketError = (socket, err) => {

    Group.findByClient(this.client).exec((err, group) => {

      if (!group) return;

      var client = group.clients.id(this.client);
      var paydesk = group.paydesks.id(this.paydesk);

      client.setErrored(err);
      client.saveToHistory();
      client.remove();
      paydesk.called_client = [];
      group.save();
      PaydeskBus.send(paydesk.number, "error");

    });

  };

  this.OnSocketClose = function(socket, had_error) {
    console.log("SOCKET CLOSED");
  }

  this.OnClientReenqueue = function(group, paydesk, client, reason) {

    client.setReenqueued(reason);

    if (client.hasReachedLimit()) {
        client.saveToHistory();
        client.remove();
        group.save();
        group.clients.map((c) => console.log(c.number));
        PaydeskBus.send(paydesk.number, 'queue_limit_reached');
    } else {
        group.reenqueueClient(client);
        group.save();
        group.clients.map((c) => console.log(c.number));
        PaydeskBus.send(paydesk.number, reason);
    }
  }

  this.OnClientCancel = function(group, paydesk, client) {
    client.setCancelled();
    client.saveToHistory();
    client.remove();
    group.save();
    group.clients.map((c) => console.log(c.number));
    PaydeskBus.send(paydesk.number, 'cancelled');
  };

  this.OnClientConfirm = function(group, paydesk, client) {
    client.setConfirmed();
    client.remove();
    paydesk.current_client = client;
    group.save();
    group.clients.map((c) => console.log(c.number));
    PaydeskBus.send(paydesk.number, 'confirmed');
  }

  this.Call = () => {

    var self = this;

    Group.findByClient(this.client).exec(function(err, group) {

      if (!group) return;

      var client = group.clients.id(self.client);
      var client_tcp_conn = net.createConnection(3131, client.ip, function() {
        self.OnSocketConnection(this);
      });

      client_tcp_conn.on('data', function(data) { self.OnSocketData(this, data); });
      client_tcp_conn.on('error', function(err) { self.OnSocketError(this , err); });
      client_tcp_conn.on('timeout', function() { self.OnSocketTimeout(this); });
      client_tcp_conn.on('close', function(had_error) { self.OnSocketClose(this, had_error); });

    });
  };

};

module.exports = ClientCaller;

