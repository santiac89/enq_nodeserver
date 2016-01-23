var express = require('express');
var router = express.Router();
var Group = require('../models/group');
var Client = require('../models/client');
var Counters = require('../models/counter');

router.get('/groups', function(req, res) {
  Group.find( { paydesks: { $elemMatch: { active: true  } } } ,function(err,groups) {
     res.json(groups);
  });
});

router.delete('/clients/:id', function(req, res) {

  Group.findAndRemoveClientByIp(req.params.id, req.connection.remoteAddress, {
    success: (client) => {
      client.saveToHistory();
      res.json(client);
    },
    error: (err) => {
      res.json(404,{});
      return;
    }
  });

});

router.post('/groups/:id/clients', function(req, res) {
  Group.findOne({_id: req.params.id }, function(err,group) {

    if (!group) {
      res.json(404,err);
      return;
    }

    var new_client = {
      ip: req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress,
      hmac: req.body.hmac
    }

    if (!group.clientIsUnique(new_client)) {
      res.json(500,{});
      return;
    }

    Counters.getNextSequence("number", function(err, counter) {

      new_client.enqueue_time = Date.now();
      new_client.number = counter.seq;

      Group.addNewClient(group._id, new_client, {
        success: (client) => {
          res.json({
            client_number: client.number,
            client_id:  client._id,
            paydesk_arrival_timeout: group.paydesk_arrival_timeout,
            group_name: group.name
          });
        },
        error: (err) => {
          res.json(500,err);
          return;
        }
      });
    });

  });
});

module.exports = router;
