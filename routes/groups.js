var express = require('express');
var router  = express.Router();
var Group   = require('../models/group');
var Paydesk = require('../models/paydesk');
var Logger = require('../util/logger');

router.get('/', function(req, res) {
  Group.find({} ,function(err,groups) {
     res.json(groups);
  });
});

router.get('/:id',function(req,res) {
  Group.findOne({_id: { $eq: req.params.id }}, function(err,group) {
      if (!group) return res.status(404).end();
      if (err) {
        Logger.error(err);
        return res.status(500).end();
      }
      res.json(group);
  });
});


router.post('/', function(req, res) {
  new Group(req.body).save(function(err, group) {

    if (err) {
      Logger.error(err);
      return res.status(500).end();
    }

    res.json(group);
  });
});

router.put('/:id', function(req, res) {
  Group.findOne({_id: req.params.id }, function(err, group) {

    if (!group) return res.status(404).end();

    if (err) {
      Logger.error(err);
      return res.status(500).end();
    }

    var newGroup = new Group(req.body);
    group.name = newGroup.name;
    group.paydesk_arrival_timeout = newGroup.paydesk_arrival_timeout;
    group.save(function(err,group) {

      if (err) {
        Logger.error(err);
        return res.status(500).end();
      }

      res.json(group);
    });
  });
});

router.delete('/:id', function(req, res) {
  Group.findOne({_id: req.params.id },function(err, group) {

    if (!group) return res.json(404,err);

    if (err) {
      Logger.error(err);
      return res.status(500).end();
    }

    group.remove();
    res.json(group);
  });
});

module.exports = router;
