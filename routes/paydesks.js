var express = require('express');
var router = express.Router();
var Group = require('../models/group');
var ClientCaller = require('../util/client_caller');

router.get('/', function(req, res) {

  Group.find({},'_id name paydesks').exec(function(err, groups) {

    var paydesks = [];

    for (i=0; i < groups.length; i++) {
      for (o=0; o < groups[i].paydesks.length; o++) {

        if (groups[i].paydesks[o].active) continue;

        var paydesk = {};

        paydesk._id =  groups[i].paydesks[o]._id;
        paydesk.number = groups[i].paydesks[o].number;
        paydesk.group_id = groups[i]._id;
        paydesk.group_name = groups[i].name;

        paydesks.push(paydesk);

      }
    }

    res.json(paydesks);

  });

});


router.delete('/:id', function(req, res) {

  Group.findByPaydesk(req.params.id).exec(function(err,group) {
    if (err) res.json(404,err);

    paydesk = group.removePaydesk(req.params.id);
    group.save();

    res.json(paydesk);

  });
});

router.get('/:id/clients/next', function(req, res) {

  Group.findByPaydesk(req.params.id).exec(function(err,group) {

    if (!group) {
      res.json(404,err);
      return;
    }

    paydesk = group.getPaydesk(req.params.id);

    var current_client = paydesk.removeClient();

    if (current_client) {

      group.confirmed_clients++;
      group.confirmed_times += Date.now() - current_client.confirmed_time;

      current_client.saveToHistory();
      group.save();

    }

    var next_client = group.getNextClient();

    if (!next_client) {
      res.json(404, {});
      return;
    };

    ClientCaller(group, paydesk, next_client).Call();

    res.json(next_client);

	});
});

module.exports = router;
