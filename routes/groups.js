var express = require('express');
var router = express.Router();
var number_generator = require('../util/local_number_generator');
var Group = require('../models/group');
var Client = require('../models/client');
var Paydesk = require('../models/paydesk');

router.get('/', function(req, res) {
  Group.find({},function(err,groups) {
     res.json(groups);
  });
});


router.get('/:id',function(req,res) {
  Group.findOne({_id: req.params.id }, function(err,group) {
      if (group === null) res.json(404,err);
      res.json(group);
  });
});


router.post('/', function(req, res) {
  new Group(req.body).save(function(err,group) {
      if (err) res.json(500,err);
      res.json(group);
  });
});

router.put('/:id', function(req, res) {
  Group.findOne({_id: req.params.id }, function(err,group) {
    if (group === null) res.json(404,[]);
    var newGroup = new Group(req.body);
    group.name = newGroup.name;
    group.timeout = newGroup.timeout;
    group.paydesks = newGroup.paydesks;
    group.save(function(err,group) {
      if (err) res.json(500,err);
      res.json(group);
    });
  });
});

router.delete('/:id', function(req, res) {
  Group.findOne({_id: req.params.id },function(err,group) {
    if (err) res.json(404,err);
    group.remove();
    res.json(group);
  });
});

router.post('/:id/clients', function(req, res) {

  Group.findOne({_id: req.params.id }, function(err,group) {

      if (group === null) res.json(404,err);

      var client = new Client(req.body);

      client.number = number_generator.get();
      client.enqueue_time = Date.now();

      client.save(function(err) {

        if (err) {
          console.log(err);
          res.json(500,err);
        }

        group.enqueueClient(client);

        group.save(function(err,group) {

          if (err) {
              console.log(err);
              res.json(500,err);
          }

          res.json({estimated_time: 0, client_number: client.number, client_id: client._id });

        });

      });

  });

});

module.exports = router;
