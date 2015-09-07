var express = require('express');
var router = express.Router();
var Paydesk = require('../models/paydesk');
var Client = require('../models/client');
var Group = require('../models/group');
var net = require('net');
var event_bus = require('../util/event_bus');

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

      if (paydesk.current_client) { // && paydesk.current_client.reenqueue_count == 2) {
        if (paydesk.current_client.reenqueue_count == 2) {
          paydesk.current_client.remove(function(err,client) {
              client.addToHistory();
          });
        }
      }

	    if (!next_client) res.json(204,{});

      paydesk.group.removeClient(next_client);
      paydesk.callClient(next_client);

      res.json(next_client);

    });
	});
});


function save_client_history(client) {
  // var client_history = ClientHistory.new();

  // client_history.last_status = paydesk.current_client.status;
  // client_history.enqueue_time = paydesk.current_client.enqueue_time;
  // client_history.called_time = paydesk.current_client.called_time;
  // client_history.exit_time = paydesk.current_client.exit_time;
  // client_history.number = paydesk.current_client.number;
  // client_history.number = paydesk.current_client.hmac;

  // client_history.save();
}

module.exports = router;
