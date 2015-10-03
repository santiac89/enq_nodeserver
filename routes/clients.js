var express = require('express');
var router = express.Router();
var Group = require('../models/group');

router.delete('/:id', function(req, res) {

  Group
  .findOne({ clients: { $elemMatch: { _id: req.params.id } } })
  .exec(function(err,group) {

    if (!group) {
      res.json(404,{});
      return;
    }

    if (req.connection.remoteAddress != group.clients.id(req.params.id).ip) {
      res.json(401,{});
      return;
    }

    var client = group.removeClient(req.params.id);
    group.save();

    res.json(client);

  });

});

module.exports = router;
