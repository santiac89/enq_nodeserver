var PaydeskBus = require('./paydesk_bus');
var Group = require('../models/group');
var Emitter = require('../models/event');

var ClientManager = function(client, paydesk, group) {

  if (!(this instanceof ClientManager))
    return new ClientManager(client, paydesk, group);

  this.client  = client;
  this.paydesk = paydesk;
  this.group   = group;

  this.OnClientCalled = function() {
    console.log("["+Date.now()+"] CLIENT " + this.client.number + " HELLO!");
    this.client.setCalledBy(this.paydesk.number);
    this.client.save();
    // (err, client) => {
    //   console.log("SAVED!")
      PaydeskBus.send(this.paydesk.number, "call_received");
      Emitter.clientCalled(client, this.paydesk);
    // });
  }


  this.OnClientConfirm = function() {
    console.log("["+Date.now()+"] CLIENT " + this.client.number + " RESPONSE [confirm]");
    this.client.setConfirmed();
    this.client.save();//(err, client) => {
    this.paydesk.removeCalledClient(this.client)
    PaydeskBus.send(this.paydesk.number, "confirmed");
    Emitter.clientConfirm(client, this.paydesk);
    // });
  }

  this.OnClientCancel = function() {
    console.log("["+Date.now()+"] CLIENT " + this.client.number + " RESPONSE [cancel]");
    this.client.setCancelled();
    this.client.save();
    // (err, client) => {
      this.paydesk.removeCalledClient(this.client);
      PaydeskBus.send(this.paydesk.number, "cancelled");
      Emitter.clientCancel(client, this.paydesk);
      // el cliente queda fuera de cualquier cola (esta guardado en la collección de `clients`)
    // });
  };

  this.OnClientReenqueue = function(reason) {
    console.log("["+Date.now()+"] CLIENT " + this.client.number + " RESPONSE [reenqueue="+ reason +"]");

    this.client.setReenqueued(reason);
    this.paydesk.removeCalledClient(this.client);

    Emitter.clientRemovedFromPaydesk(this.client, this.paydesk, reason);

    if (this.client.hasReachedLimit()) {

      PaydeskBus.send(this.paydesk.number, 'queue_limit_reached');
      Emitter.clientReachedReenqueueLimit(this.client, this.paydesk);

    } else {

      this.group.enqueueClient(this.client , (err) => {
        PaydeskBus.send(this.paydesk.number, reason);
        Emitter.clientReenqueued(this.client, this.paydesk, reason);
      });

    }
    // Group.reenqueueClient(this.client._id, reason,
    //   {
    //     reenqueued: (client) => {
    //       PaydeskBus.send(client.assigned_to, reason);
    //     },
    //     limit_reached: (client) => {
    //       console.log("["+Date.now()+"] CLIENT " + client.number + " REACHED LIMIT");
    //
    //     },
    //     error: function(err) {
    //       console.log(err)
    //     }

    //   }
    // );
  }

}

module.exports = ClientManager;
