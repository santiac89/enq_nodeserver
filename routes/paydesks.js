var express = require('express');
var router = express.Router();
var app = express();
var Paydesk = require('../models/paydesk');
var Client = require('../models/client');
var Group = require('../models/group');
var transaction_logger = require('../util/transaction_logger');

router.get('/', function(req, res) {

	Paydesk.find({},function(err,paydesks) {
		res.json(paydesks);
	});

});

router.post('/',function(req, res) {

  new Paydesk(req.body).save(function(err,paydesk) {
    if (err) res.json(500,err);

    paydesk.populate('group');
    paydesk.group.paydesks.push = paydesk._id;
    paydesk.group.save();

  });	

});

router.get('/:id/clients/next', function(req, res) {

	Paydesk.find({_id: req.params.id }).populate('group current_client').exec(function(err,paydesk) {
    
	    if (paydesk === null) res.json(404,err);
	    
	    Group.populate(paydesk.group,{path: 'clients', component: 'Group'});

	    var client = paydesk.group.clients.shift();

	    if (client === undefined) {
	    	//TODO No hay proximo cliente, dejar boton habilitando
	    	res.json({response: 'no_client'});
	    }

	    paydesk.group.save();

	    if (paydesk.current_client) {
	      //TODO Guardar registro del cliente para estadisticas y borrarlo si ya es su segunda vez
	    }

	    paydesk.current_client = client;
	    paydesk.save();

	    var tcp_client = net.createConnection(3131, client.ip, function() {
			net.write({paydesk: paydesk_number});
		}); 

	    tcp_client.on('data', function(data) {

	    	if (data.response == 'more_time')
	    		reenqueue(client, paydesk.group);

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

function reenqueue(client , group) {
	client.reenqueue_count++;
	group.clients.push(client);
	group.save();
}

module.exports = router;