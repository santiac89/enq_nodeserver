var express = require('express');
var router = express.Router();
var Group = require('../models/group');
var ClientCaller = require('../util/client_caller');

//var transaction_logger = require('../util/transaction_logger');

router.get('/', function(req, res) {

  Group.find({},'_id name paydesks').exec(function(err, groups) {

    var paydesks = [];

    for (i=0; i < groups.length; i++) {
      for (o=0; o < groups[i].paydesks.length; o++) {

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

    paydesk = group.paydesks.id(req.params.id);
    res.json(paydesk);
    paydesk.remove();
    group.save();

  });
});

router.get('/:id/clients/next', function(req, res) {

  Group.findByPaydesk(req.params.id).exec(function(err,group) {

    if (!group) res.json(404,err);

    paydesk = group.paydesks.id(req.params.id);

    var current_client = paydesk.current_client.pop();

    if (current_client) {
      current_client.saveToHistory();
      group.save();
    }

    var next_client = null;

    for (i = group.clients.length - 1; i >= 0; i--) {
      next_client = group.clients[i].status != 'called' ? group.clients[i] : null;
    }

    if (!next_client) { res.json(404, {}); return; };



    ClientCaller(group, paydesk, next_client).Call();
    res.json(next_client);

	});
});

module.exports = router;
