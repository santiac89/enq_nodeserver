var express = require('express');
var router = express.Router();
var Paydesk = require('../models/paydesk');
var Client = require('../models/client');
var ClientCaller = require('../util/client_caller');

//var transaction_logger = require('../util/transaction_logger');

router.get('/', function(req, res) {
	Paydesk.find().populate('group').exec(function(err,paydesks) {
		res.json(paydesks);
	});
});

router.post('/',function(req, res) {

  new Paydesk(req.body).save(function(err,paydesk) {

    if (err) {
    	console.log(err);
    	res.json(500,err);
    }

    paydesk.populate('group', function (err, user) {
  		paydesk.group.paydesks.push(paydesk._id);
    	paydesk.group.save();
		})
  });

});

router.put('/:id', function(req, res) {
  Paydesk.findOne({_id: req.params.id }, function(err,paydesk) {
    if (paydesk === null) res.json(404,[]);
    var newPaydesk = new Paydesk(req.body);

    paydesk.number = newPaydesk.number;
    paydesk.group = newPaydesk.group;

    paydesk.save(function(err,paydesk) {
      if (err) res.json(500,err);
      res.json(paydesk);
    });
  });
});

router.delete('/:id', function(req, res) {
  Paydesk.findOne({_id: req.params.id },function(err,paydesk) {
    if (err) res.json(404,err);
    paydesk.remove();
    res.json(paydesk);

  });
});

router.get('/:id/clients/next', function(req, res) {

	Paydesk.findOne({_id: req.params.id }).populate('group current_client').exec(function(err,paydesk) {

    if (!paydesk) res.json(404,err);

    Client.findOne({_id: paydesk.group.clients.last()}, function(err,next_client) {

	    if (!next_client) { res.json({}); return; };

      paydesk.group.removeClient(next_client);
      paydesk.group.save();

      ClientCaller(next_client, paydesk).Call();
      res.json(next_client);

    });
	});
});

module.exports = router;
