var express = require('express');
var router = express.Router();
var Group = require('../models/group');
var config = require('../config');
var ClientCaller = require('../util/client_caller');

router.get('/:id', function(req, res) {

  Group.findByPaydesk(req.params.id).exec(function(err,group) {

    if (!group) {
      res.json(404,{});
      return;
    }

    var paydesk = group.paydesks.id(req.params.id);
    var current_client = {};
    var called_client = {};

    if (paydesk.current_client.length > 0) {

      current_client.number = paydesk.current_client[0].number;
      current_client.enqueue_time = paydesk.current_client[0].enqueue_time;
      current_client.remain_to_arrive = 0;

      switch (paydesk.current_client[0].status) {

        case 'confirmed':
         current_client.response = "Confirmado";
        break;

        case 'error':
          current_client.response = "ERROR";
        break;

        case 'cancelled':
          current_client.response = "Cancelado";
        break;

        default:
          current_client.response = "Reencolado";
        break;
      }

      if (paydesk.current_client[0].confirmed_time + (group.paydesk_arrival_timeout*1000) > Date.now()) {
        current_client.remain_to_arrive = Math.round((((group.paydesk_arrival_timeout*1000) + paydesk.current_client[0].confirmed_time) - Date.now())/1000);
      }

    }

    if (paydesk.called_client.length > 0) {

      called_client.number = paydesk.called_client[0].number;
      called_client.enqueue_time = paydesk.called_client[0].enqueue_time;
      called_client.remain_to_response = 0;

      if (paydesk.called_client[0].called_time + (config.call_timeout*1000) > Date.now()) {
        called_client.remain_to_response =  Math.round((((config.call_timeout*1000) + paydesk.called_client[0].called_time) - Date.now())/1000);
      }

    }

    res.render('caller',{
      group: group,
      paydesk: group.paydesks.id(req.params.id),
      user: req.user,
      call_timeout: config.call_timeout,
      current_client: current_client,
      called_client: called_client
    });

  });

});

router.get('/:id/group', function(req, res) {

  Group.findByPaydesk(req.params.id).exec(function(err,group) {

    if (!group) {
      res.json(404,err);
      return;
    }

    res.json(group);

  })
});

router.get('/:id/clients/next', function(req, res) {

  Group.findByPaydesk(req.params.id).exec(function(err,group) {

    if (!group) {
      res.json(404,err);
      return;
    }

    paydesk = group.paydesks.id(req.params.id);

    if (paydesk.current_client.length == 1) {

      group.confirmed_clients++;
      group.confirmed_times += Date.now() - paydesk.current_client[0].confirmed_time;

      paydesk.current_client[0].saveToHistory();
      paydesk.current_client[0].remove();

      group.save();

    }

    if (paydesk.called_client.length == 1) {
      if (!next_client) {
        res.json(404, {});
        return;
      };
    }

    var next_client = group.getNextClient();

    if (!next_client) {
      res.json(404, {});
      return;
    };

    ClientCaller(group._id, paydesk._id, next_client._id).Call();

    res.json(next_client);

  });
});

module.exports = router;
