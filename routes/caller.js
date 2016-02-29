var express = require('express');
var router = express.Router();
var Group = require('../models/group');
var Paydesk = require('../models/paydesk');
var config = require('../config');
var ClientCaller = require('../util/client_caller');

router.get('/:id', function(req, res) {
  Paydesk.findOne({ _id: req.params.id }).populate('group').exec(function(err, paydesk) {
    if (!paydesk) return res.json(404,{});

    var group = paydesk.group;
    var current_client = {};
    var called_client = {};

    // TODO: Mover esta logica
    // if (paydesk.current_client.length > 0) {
    //   current_client.number = paydesk.current_client[0].number;
    //   current_client.enqueue_time = paydesk.current_client[0].enqueue_time;
    //   current_client.remain_to_arrive = 0;
    //
    //   switch (paydesk.current_client[0].status) {
    //     case 'confirm':
    //      current_client.response = "Confirmado";
    //     break;
    //     case 'error':
    //       current_client.response = "ERROR";
    //     break;
    //     case 'cancelled':
    //       current_client.response = "Cancelado";
    //     break;
    //     default:
    //       current_client.response = "Reencolado";
    //     break;
    //   }
    //
    //   if (paydesk.current_client[0].confirmed_time + (group.paydesk_arrival_timeout*1000) > Date.now()) {
    //     current_client.remain_to_arrive = Math.round((((group.paydesk_arrival_timeout*1000) + paydesk.current_client[0].confirmed_time) - Date.now())/1000);
    //   }
    // }

    // if (paydesk.called_client.length > 0) {

    //   called_client.number = paydesk.called_client[0].number;
    //   called_client.enqueue_time = paydesk.called_client[0].enqueue_time;
    //   called_client.remain_to_response = 0;

    //   if (paydesk.called_client[0].called_time + (config.call_timeout*1000) > Date.now()) {
    //     called_client.remain_to_response =  Math.round((((config.call_timeout*1000) + paydesk.called_client[0].called_time) - Date.now())/1000);
    //   }

    // }

    res.render('caller',{
      group: group,
      paydesk: paydesk,
      user: req.user,
      call_timeout: config.call_timeout,
      current_client: current_client,
      called_client: called_client
    });

  });

});

router.get('/:id/group', function(req, res) {
  Group.findByPaydesk(req.params.id).exec(function(err,group) {
    if (!group || err) return res.json(404,err);
    res.json(group);
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
  // Group.findByPaydesk(req.params.id, function(err, group) {

  //   if (!group || err) return res.json(500, err);

  //   group.getNextClientForPaydesk(req.params.id, function(err, client) {

  //     if (!client || err) return res.json(500, err);

  //     client.paydesk = group.paydesks.id(req.params.id);

  //     // group, client y paydesk
  //     // paydesk.tryCall(client)

  //     client.save(function(err) {
  //       console.log("ACA");
  //       ClientCaller(client, client.paydesk, client.group).Call();
  //       res.json(client);
  //     });

  //   });

  // });
});

module.exports = router;
