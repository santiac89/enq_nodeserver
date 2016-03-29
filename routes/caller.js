var express = require('express');
var router = express.Router();
var Group = require('../models/group');
var Paydesk = require('../models/paydesk');
var config = require('../config');
var ClientCaller = require('../util/client_caller');

router.get('/:id', function(req, res) {
  Paydesk.findOne({ _id: req.params.id }).populate('group confirmed_client called_client').exec(function(err, paydesk) {
    if (!paydesk) return res.json(404,{});

    var group = paydesk.group;
    var current_client = paydesk.confirmed_client;
    var called_client  = paydesk.called_client;
    var now = Date.now();

    console.log(current_client)
    if (current_client && (current_client.arrivalTime(group.paydesk_arrival_timeout) > now)) {
      current_client.remain_to_arrive = current_client.remainingSecondsToArrive(now, group.paydesk_arrival_timeout)
    }

    console.log(called_client)
    if (called_client && (called_client.toleranceCallTime(config.call_timeout) > now)) {
      called_client.remain_to_response = called_client.remainingSecondsToReenqueue(now, config.call_timeout)
    }

    var response = {
      group: group,
      paydesk: paydesk,
      user: req.user,
      call_timeout: config.call_timeout,
      current_client: current_client || {},
      called_client: called_client || {}
    };

    res.render('caller', response);
  });

});

router.get('/:id/group', function(req, res) {
  Paydesk.findOne({ _id: req.params.id }).populate('group').exec(function(err, paydesk) {
    if (!paydesk || err) return res.json(404,err);
    res.json(paydesk.group);
  })
});

router.get('/:id/clients/next', function(req, res) {
  Paydesk.findOne(req.params.id).populate('group').exec(function(err, paydesk) {

    if (!paydesk.group || err) return res.json(500, err);

    paydesk.fetchNextClient(function(err, client) {

      if (err) return res.json(500, err);

      if (!client) return res.json(404, {}); // No more clients to call

      ClientCaller(client, paydesk, paydesk.group).Call();
      res.json(client);

    });

  });
});

module.exports = router;
