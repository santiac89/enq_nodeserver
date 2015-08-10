var express = require('express');
var router = express.Router();
var app = express();
var Paydesk = require('../models/paydesk');
var Client = require('../models/client');

router.get('/', function(req, res) {

	Paydesk.find({},function(err,paydesks) {
		res.json(paydesks);
	});

});

router.put('/:number/respond', function(req, res) {

	var newStatus = changeClientStatus(req,res);



});


function changeClientStatus(req,res) {

	Paydesk.find({number: req.params.number}).populate('current_client').exec(function(err,paydesk) {
		
		if (paydesk === null) res.json(404,err);

		var clientResponse = new Client(req.body);

		Client.find({hmac: clientResponse.hmac},function(err,client)
		{
			if (client === null) res.json(404,err);

			if (paydesk.current_client.hmac == client.hmac) {

				client.status = clientResponse.status;
				client.last_status_time = new Date().getTime();
				client.save();
				
			}
		});

	});
}

module.exports = router;