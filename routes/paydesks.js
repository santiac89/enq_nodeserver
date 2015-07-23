var express = require('express');
var router = express.Router();
var app = express();
var Paydesk = require('../models/paydesk');

router.get('/', function(req, res) {

	Paydesk.find({},function(err,paydesks) {
		res.json(paydesks);
	});

});

module.exports = router;