var express = require('express');
var router = express.Router();
var app = express();
var Paydesk = require('../models/paydesk');
var Client = require('../models/client');
var Group = require('../models/group');
var net = require('net');

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


	    var client_id = paydesk.group.clients.shift();

	    Client.findOne({_id: client_id}, function(err,client) {

	    if (client === undefined) {
	    	//TODO No hay proximo cliente, dejar boton habilitado
	    	res.json({response: 'no_client'});
	    }

	    paydesk.group.save();

	    if (paydesk.current_client) {
	      //TODO Guardar registro del cliente para estadisticas y borrarlo si ya es su segunda vez
	    }


	    var tcp_client = net.createConnection(3131, client.ip, function() {
				tcp_client.write(JSON.stringify({paydesk: paydesk.number}));
			});

	    tcp_client.on('data', function(data) {

	    	switch (data.response) {
	    		case 'more_time':
	    			reenqueue(client, paydesk.group);
	    		break;

	    		case 'confirm':
	    			paydesk.current_client = client;
	    			paydesk.save();
	    		break;
	    	}

					tcp_client.end();
					res.json(data);
	    });

	    tcp_client.setTimeout(paydesk.group.timeout, function(){
	    	reenqueue(client, paydesk.group);
	    	tcp_client.end();
	    	res.json({response: 'client_response_timeout'})
	    });

	    tcp_client.on('error', function(err)
	    {
	    	tcp_client.end();
	    	res.json({response: 'client_offline'});
	    });
	    });

	});
});

function reenqueue(client , group) {
	client.reenqueue_count++;
	group.clients.push(client._id);
	group.save();
}

module.exports = router;
