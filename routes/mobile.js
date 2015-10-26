var express = require('express');
var router = express.Router();
var number_generator = require('../util/local_number_generator');
var Group = require('../models/group');

router.get('/groups', function(req, res) {
  Group.find( { paydesks: { $elemMatch: { active: true  } } } ,function(err,groups) {
     res.json(groups);
  });
});

router.delete('/clients/:id', function(req, res) {

  Group
  .findOne({ clients: { $elemMatch: { _id: req.params.id } } })
  .exec(function(err,group) {

    if (!group) {
      res.json(404,{});
      return;
    }

    if (req.connection.remoteAddress != group.clients.id(req.params.id).ip) {
      res.json(401,{});
      return;
    }

    var client = group.clients.id(req.params.id);
    client.saveToHistory();
    client.remove();
    group.save();

    res.json(client);

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

    if (app.settings.env == 'production' && !group.clientIsUnique(new_client)) {
      res.json(500,{});
      return;
    }

    new_client.enqueue_time = Date.now();
    new_client.number = number_generator.get();

    group.clients.push(new_client);

    group.save(function(err,group) {

      if (err) {
        res.json(500,err);
        return;
      }

      res.json({
        client_number: group.clients[group.clients.length - 1].number,
        client_id:  group.clients[group.clients.length - 1]._id,
        paydesk_arrival_timeout: group.paydesk_arrival_timeout,
        group_name: group.name
      });

    });
  });
});

module.exports = router;
