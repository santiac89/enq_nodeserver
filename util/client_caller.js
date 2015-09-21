var PaydeskBus = require('./paydesk_bus');
var config = require('../config');
var net = require('net');
var Group = require('../models/group');

var ClientCaller = function(group, paydesk, client){

   if (!(this instanceof ClientCaller))
    return new ClientCaller(group, paydesk, client);

  this.client = client;
  this.paydesk = paydesk;
  this.group = group;

  this.OnSocketConnection = function(socket) {

    this.client.setCalledBy(this.paydesk.number);
    this.group.save();

    socket.write(JSON.stringify({
      paydesk_number: this.paydesk.number,
      reenqueue_count: this.client.reenqueue_count
    }) + '\n');

    socket.setTimeout(config.call_timeout);

  };

  this.OnSocketData = function(socket, response) {

    socket.end();

    this.refreshReferences();

    if (response == "confirm") {

      this.client.remove();
      this.client.setConfirmed();
      this.client.saveToHistory();

      this.paydesk.addClient(this.client);

      this.group.save(function(err) {
        if (err) console.log(err)
      });

      PaydeskBus.send(this.paydesk.number, 'confirmed');

    } else if (response == "cancel") {

      this.client.remove();
      this.client.setCancelled();
      this.client.saveToHistory();

      this.group.save(function(err) {
        if (err) console.log(err)
      });

      PaydeskBus.send(this.paydesk.number, 'cancelled');

    } else if (response == "extend") {

      this.client.setReenqueued("extend");

      if (this.client.hasReachedLimit()) {

        this.client.remove();
        this.client.saveToHistory();

        this.group.save(function(err) {
          if (err) console.log(err)
        });

        PaydeskBus.send(this.paydesk.number, 'queue_limit_reached');

      } else {

        this.group.reenqueueClient(this.client._id);

        this.group.save(function(err) {
          if (err) console.log(err)
        });

        PaydeskBus.send(this.paydesk.number, "extend");

      }
    }
  };

  this.OnSocketTimeout = function(socket) {

    socket.end();

    this.refreshReferences();

    this.client.setReenqueued("response_timeout");

    if (this.client.hasReachedLimit()) {

        this.client.remove();
        this.client.saveToHistory();

        this.group.save(function(err) {
          if (err) console.log(err)
        });

        PaydeskBus.send(this.paydesk.number, 'queue_limit_reached');

    } else {

        this.group.reenqueueClient(this.client._id);

        this.group.save(function(err) {
          if (err) console.log(err)
        });

        PaydeskBus.send(this.paydesk.number, 'response_timeout');

    }

  };

  this.OnSocketError = function(socket, err) {

    this.refreshReferences();

    console.log(err)

    this.client.remove();
    this.client.setErrored(err);
    this.client.saveToHistory();
    this.group.save();

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

  this.refreshReferences = function() {
    var _this = this;
    Group.findOne({ _id: this.group._id }).exec(function(err, group) {
      _this.group = group;
      _this.paydesk = group.paydesks.id(_this.paydesk._id);
      _this.client = group.clients.id(_this.client._id);
    });
  };

};

module.exports = ClientCaller;

