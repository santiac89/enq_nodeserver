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

    group.clients.id(req.params.id).remove();
    group.save();

    res.json({});

  });

});

module.exports = router;
