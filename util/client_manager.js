var PaydeskBus = require('./paydesk_bus');
var Group = require('../models/group');

var ClientManager = function(client) {

  if (!(this instanceof ClientManager))
    return new ClientManager(client);

  this.client = client;

  this.OnClientCalled = function() {
    console.log("["+Date.now()+"] CLIENT " + this.client.number + " HELLO!");
    Group.calledClient(this.client._id, {
      success: (client) => {
        PaydeskBus.send(this.client.assigned_to, "call_received");
      }
    });
  }

  this.OnClientConfirm = function() {
    console.log("["+Date.now()+"] CLIENT " + this.client.number + " RESPONSE [confirm]");
    Group.confirmClient(this.client._id, {
      success: (client) => {
        PaydeskBus.send(this.client.assigned_to, "confirmed");
      }
    });
  }

  this.OnClientCancel = function() {
    console.log("["+Date.now()+"] CLIENT " + this.client.number + " RESPONSE [cancel]");
    Group.cancelClient(this.client._id, {
      success: (client) => {
        PaydeskBus.send(this.client.assigned_to, "cancelled");
      }
    });
  };

  this.OnClientReenqueue = function(reason) {
    console.log("["+Date.now()+"] CLIENT " + this.client.number + " RESPONSE [reenqueue="+ reason +"]");
    Group.reenqueueClient(this.client._id, reason,
      {
        reenqueued: (client) => {
          PaydeskBus.send(client.assigned_to, reason);
        },
        limit_reached: (client) => {
          console.log("["+Date.now()+"] CLIENT " + client.number + " REACHED LIMIT");
          PaydeskBus.send(client.assigned_to, 'queue_limit_reached');
        },
        error: function(err) {
          console.log(err)
        }

      }
    );
  }

}

module.exports = ClientManager;
