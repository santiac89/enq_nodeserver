var PaydeskBus = require('./paydesk_bus');
var config = require('../config');
var net = require('net');
var Group = require('../models/group');

var ClientCaller = function(client) {

   if (!(this instanceof ClientCaller))
    return new ClientCaller(client);

  this.client = client;
  // this.paydesk = paydesk;
  // this.group = group;

  this.Call = () => {
    var self = this;
    var client_tcp_conn = net.createConnection(3131, this.client.ip, function() { self.OnSocketConnection(this); });
    client_tcp_conn.on('data', function(data) { self.OnSocketData(this, data); });
    client_tcp_conn.on('error', function(err) { self.OnSocketError(this , err); });
    //client_tcp_conn.on('end', function() { self.OnSocketEnd(this); });
    client_tcp_conn.on('timeout', function() { self.OnSocketTimeout(this); });
    client_tcp_conn.on('close', function(had_error) { self.OnSocketClose(this, had_error); });
  };

  // TODO: MOVER TODO ESTO A ALGUNA ENTIDAD QUE MANEJE LAS RESPUESTAS
  this.OnSocketConnection = function(socket) {

      var call_message = JSON.stringify({
        paydesk_number: this.client.assigned_to,
        reenqueue_count: this.client.reenqueue_count,
        next_estimated_time: this.client.next_estimated_time
      }) + '\n';

      socket.write(call_message, 'UTF-8', function(err) {
        socket.setTimeout(config.call_timeout*1000);
      });

  };

  this.OnSocketData = function(socket, response) {
    // Group.findByClient(this.client).exec((err, group) => {

    //   if (!group) return;

    //   var client = group.clients.id(this.client);
    //   var paydesk = group.paydesks.id(this.paydesk);

      if (response.toString() == "call_received") {
        this.OnClientCalled();
        socket.end();
      } else if (response.toString() == "confirm") {
        this.OnClientConfirm();
        socket.end();
      } else if (response.toString() == "cancel") {
        this.OnClientCancel();
        socket.end();
      } else if (response.toString() == "extend") {
        this.OnClientReenqueue("extend");
        socket.end();
      }

    // });
  };

  this.OnClientCalled = function() {
    console.log("["+Date.now()+"] CLIENT " + this.client.number + " HELLO!");

    Group.updateClient(this.client._id, { status: "called", called_time: Date.now() }, (err) => {
    // client.setCalledBy(this.paydesk.number);
    // paydesk.called_client = client;
    // group.save((err) => {
      PaydeskBus.send(this.client.assigned_to, "call_received");
    });
  }

  this.OnClientConfirm = function() {

    // Group.confirmClient(client)
    console.log("["+Date.now()+"] CLIENT " + this.client.number + " RESPONSE [confirm]");

    Group.updateClient(this.client._id, { status: "called", called_time: Date.now() }, (err) => {
      // TODO: GET AND REMOVE CLIENT
      PaydeskBus.send(this.client.assigned_to, 'confirmed');
    });
    // paydesk.called_client = [];
    // client.setConfirmed();
    // client.remove();
    // paydesk.current_client = client;
    // group.save((err) => {
      // PaydeskBus.send(paydesk.number, 'confirmed');
    // });
  }

  this.OnClientCancel = function() {

    console.log("["+Date.now()+"] CLIENT " + this.client.number + " RESPONSE [cancel]");

    Group.updateClient(this.client._id, { status: "called", called_time: Date.now() }, (err) => {
      // TODO: GET AND REMOVE CLIENT
      PaydeskBus.send(this.client.assigned_to, 'confirmed');
    });

    paydesk.called_client = [];
    client.setCancelled();
    client.saveToHistory();
    client.remove();

    group.save((err) => {
      PaydeskBus.send(this.client.assigned_to, 'cancelled');
    });
  };

  this.OnClientReenqueue = function(reason) {
    console.log("["+Date.now()+"] CLIENT " + this.client.number + " RESPONSE [reenqueue="+ reason +"]");
    client.setReenqueued(reason);
    paydesk.called_client = [];

    if (client.hasReachedLimit()) {
      // TODO: GET AND REMOVE CLIENT
      client.saveToHistory();
      client.remove();
      group.save((err) => {
        console.log("["+Date.now()+"] CLIENT " + this.client.number + " REACHED LIMIT");
        PaydeskBus.send(this.client.assigned_to, 'queue_limit_reached');
      });
    } else {
      // TODO: UPDATE,GET AND REENQUEUE CLIENT
      group.reenqueueClient(client);
      group.save((err) => {
        PaydeskBus.send(this.client.assigned_to, reason);
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
        PaydeskBus.send(this.client.assigned_to, 'cancelled');
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
        PaydeskBus.send(this.client.assigned_to, "error");
      });
    });
  };

};

module.exports = ClientCaller;

