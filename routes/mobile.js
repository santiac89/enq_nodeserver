var express = require('express');
var router = express.Router();
var Group = require('../models/group');
var Client = require('../models/client');
var Counters = require('../models/counter');

router.get('/groups', function(req, res) {
  Group.find({}, function(err,groups) {
     res.json(groups);
  });
});

router.delete('/clients/:id', function(req, res) {
  Client.findOne({ _id: req.params.id }).populate("group").exec(function(err, client) {
    client.group.removeClient(client);
    client.saveToHistory();
    client.remove();
    res.json(200);
  });
});

router.post('/groups/:id/clients', function(req, res) {
  Group.findOne({ _id: req.params.id }, function(err, group) {

    if (!group || err) {
      res.json(404,err);
      return;
    }

    Counters.getNextSequence("number", function(err, counter) {

      var client_info = {
        ip: req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress,
        hmac: req.body.hmac,
        enqueue_time: Date.now(),
        number: counter.seq
      }

      Client.findOrCreate(client_info, function(err, client) {
        if (err) return res.json(500, err);

        group.enqueueClient(client, function(err) {

          client.group = group;
          client.save();

          res.json({
            client_number: client.number,
            client_id:  client._id,
            paydesk_arrival_timeout: group.paydesk_arrival_timeout,
            group_name: group.name
          });
        });

      });

    });

  });
});

module.exports = router;
