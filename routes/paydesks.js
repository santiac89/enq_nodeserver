var express = require('express');
var router = express.Router();
var app = express();


router.get('/', function(req, res) {

  res.json(req.app.get('paydesks'));

});

module.exports = router;