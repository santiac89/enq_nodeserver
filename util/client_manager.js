var PaydeskBus = require('./paydesk_bus');
var Group = require('../models/group');
var Emitter = require('../models/event');
var Logger = require('./logger');

var ClientManager = function(client, paydesk, group) {

  if (!(this instanceof ClientManager))
    return new ClientManager(client, paydesk, group);

  this.client  = client;
  this.paydesk = paydesk;
  this.group   = group;

  this.OnClientCalled = function() {
    Logger.info(`[${Date.now()}] CLIENT ${this.client.number} CALLED`);
    PaydeskBus.send(this.paydesk.number, "called");
    Emitter.clientCalled(client, this.paydesk);
  }

  this.OnClientConfirm = function() {
    Logger.info(`[${Date.now()}] CLIENT ${this.client.number} RESPONSE [confirm]`);
    this.client.confirm();
    this.paydesk.waitForClient(this.client);
    PaydeskBus.send(this.paydesk.number, "confirmed");
    Emitter.clientConfirm(client, this.paydesk);
  }

  this.OnClientCancel = function() {
    Logger.info(`[${Date.now()}] CLIENT ${this.client.number} RESPONSE [cancel]`);
    this.client.cancel();
    this.paydesk.removeCalledClient(this.client);
    PaydeskBus.send(this.paydesk.number, "cancelled");
    Emitter.clientCancel(client, this.paydesk);
  };

  this.OnClientReenqueue = function(reason) {
    Logger.info(`[${Date.now()}] CLIENT ${this.client.number} RESPONSE [reenqueue=${reason}]`);

    this.client.reenqueue(reason);
    this.paydesk.removeCalledClient(this.client);

    Emitter.clientRemovedFromPaydesk(this.client, this.paydesk, reason);

    if (this.client.hasReachedLimit()) {

      this.client.leave();
      PaydeskBus.send(this.paydesk.number, 'queue_limit_reached');
      Emitter.clientReachedReenqueueLimit(this.client, this.paydesk);

    } else {

      this.group.enqueueClient(this.client , (err) => {
        if (err) Logger.error(err);
        PaydeskBus.send(this.paydesk.number, reason);
        Emitter.clientReenqueued(this.client, this.paydesk, reason);
      });

    }
  }

}

module.exports = ClientManager;
