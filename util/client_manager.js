var PaydeskBus = require('./paydesk_bus');
var config = require('../config');
var net = require('net');
var Group = require('../models/group');

var ClientManager = function(client) {

  if (!(this instanceof ClientManager))
    return new ClientManager(client);

  this.client = client;

  this.OnClientCalled = function() {
    console.log("["+Date.now()+"] CLIENT " + this.client.number + " HELLO!");
    Group.findAndUpdateClient(this.client._id,
      { status: "called", called_time: Date.now() },
      {
        success: (client) => {

          Group.setPaydeskCalledClient(client, {
            success: () => {
              PaydeskBus.send(this.client.assigned_to, "call_received");
            }
          });

        }
      }
    );
  }

  this.OnClientConfirm = function() {
    console.log("["+Date.now()+"] CLIENT " + this.client.number + " RESPONSE [confirm]");
    Group.findAndUpdateClient(this.client._id,
      { status: "confirm", confirmed_time: Date.now() },
      {
        success: (client) => {

          Group.findAndRemoveClient(this.client._id, {

            success: (client) => {

              client.saveToHistory();

              Group.setPaydeskCurrentClient(client, {
                success: () => {
                   PaydeskBus.send(this.client.assigned_to, "confirmed");
                }
              });

            }

          });
        }
      }
    );
  }

  this.OnClientCancel = function() {
    console.log("["+Date.now()+"] CLIENT " + this.client.number + " RESPONSE [cancel]");
    Group.findAndUpdateClient(this.client._id,
      { status: "cancel", cancelled_time: Date.now() },
      {
        success: (client) => {

          Group.findAndRemoveClient(this.client._id, {

            success: (client) => {

              client.saveToHistory();

              Group.removePaydeskCalledClient(this.client.assigned_to, {
                success: () => {
                  PaydeskBus.send(this.client.assigned_to, "cancelled");
                }
              });

            }

          });

        }
      }
    );
  };

  this.OnClientReenqueue = function(reason) {
    console.log("["+Date.now()+"] CLIENT " + this.client.number + " RESPONSE [reenqueue="+ reason +"]");

    Group.findAndReenqueueClient(this.client._id, reason,
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
