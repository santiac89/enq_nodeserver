var express = require('express');
var router = express.Router();
var Client = require('../models/client');

router.delete('/:id', function(req, res) {
  Client.findOne({_id: req.params.id },function(err,client) {
    if (!client) {
      res.json(404,{});
      return;
    }
    client.remove(function() { res.json("true") });
  });
});

module.exports = router;
