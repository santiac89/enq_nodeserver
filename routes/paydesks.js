var express = require('express');
var router = express.Router();
var Paydesk = require('../models/paydesk');
var Client = require('../models/client');
var Group = require('../models/group');
var net = require('net');
var event_bus = router.get('event_bus');

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

	    if (paydesk === null) res.json(404,err);

      if (paydesk.current_client) {

        if (paydesk.current_client.reenqueue_count == 2) {

          paydesk.current_client.remove(function(err,client) {

            var client_history = ClientHistory.new();

            client_history.last_status = paydesk.current_client.status;
            client_history.enqueue_time = paydesk.current_client.enqueue_time;
            client_history.called_time = paydesk.current_client.called_time;
            client_history.exit_time = paydesk.current_client.exit_time;
            client_history.number = paydesk.current_client.number;
            client_history.number = paydesk.current_client.hmac;

            client_history.save();

          });

        }
      }

	    var next_client_id = paydesk.group.clients.shift();
      paydesk.group.save();

	    if (next_client_id === undefined) {
	    	res.json(204,{});
	    }

      Client.findOne({_id: next_client_id}, function(err,client) {

        paydesk.current_client = next_client_id;

  	    var tcp_client = net.createConnection(3131, client.ip, function() {
  				tcp_client.write(JSON.stringify({paydesk: paydesk.number}));
          set_called(client);
          event_bus.emit('client_response', client);
  			});

  	    tcp_client.on('data', function(data) {

          if (data.response == 'confirm') {
            set_confirmed(client, paydesk);
          } else {
            set_reenqueued(client, paydesk.group, data.response);
          }

          event_bus.emit('client_response', client);
					tcp_client.end();
  	    });

  	    tcp_client.setTimeout(paydesk.group.timeout, function(){
  	    	set_reenqueued(client, paydesk.group, "client_response_timeout");
          event_bus.emit('client_response', client);
  	    	tcp_client.end();
  	    });

  	    tcp_client.on('error', function(err)
  	    {
          set_reenqueued(client, paydesk.group, "client_gone");
          event_bus.emit('client_response', client);
  	    	tcp_client.end();
  	    });

        res.json(client);

      });
	});
});

function set_reenqueued(client, group, status) {
    client.reenqueue_count++;
    client.status = status;
    client.save();
    group.clients.push(client._id);
    group.save();
}

function set_confirmed(client, paydesk) {
  paydesk.current_client = client._id;
  client.status = "confirmed";

  paydesk.save();
  client.save();
}

function set_called(client) {
  client.status = 'called';
  client.called_time = Date.now();
  client.save();
}

module.exports = router;
