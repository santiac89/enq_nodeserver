var express = require('express');
var router = express.Router();
var app = express();
var Group = require('../models/group');
var Client = require('../models/client');

router.get('/', function(req, res) {
  Group.find({},function(err,groups) {
     res.json(groups);
  });
});


router.get('/:id',function(req,res) {
  Group.findOne({_id: req.params.id }, function(err,group) {
      if (group === null) res.json(err,404);
      res.json(group);
  });
});


router.post('/', function(req, res) {
  new Group(req.body).save(function(err,group) {
      if (err) res.json(err,500);
      res.json(group);
  });
});

router.put('/:id', function(req, res) {
  Group.findOne({_id: req.params.id }, function(err,group) {
    if (group === null) res.json([],404);
    var newGroup = new Group(req.body);
    group.name = newGroup.name;
    group.timeout = newGroup.timeout;
    group.paydesks = newGroup.paydesks;
    group.save(function(err,group) {
      if (err) res.json(err,500);
      res.json(group);
    });
  });
});

router.delete('/:id', function(req, res) {
  Group.findOne({_id: req.params.id }).remove(function(err) {
     if (err) res.json(err,404);
  });
});

router.post('/:id/clients', function(req, res) {
  
  var client = new Client(req.body);

  Group.findOne({_id: req.params.id }, function(err,group) {
      if (group === null) res.json(err,404);
      group.clients.push(client);

      group.save(function(err,group) {
        if (err) res.json(err,500);
        res.json(group);
      });
  });

});

router.get('/:id/clients/next', function(req, res) {
  Group.find({_id: req.params.id }).populate('paydesks').exec(function(err,group) {
    if (group === null) res.json(err,404);
    
    var client = group.clients.pop();

    group.save(function(err,group) {
        if (err) res.json(err,500);
        res.json(group);
    });

    var min = 999;
    var selectedPaydesk = {};
    for (var i in group.paydesks) {
      if (group.paydesks[i].clients.length < min) {
        min = group.paydesks[i].clients.length;
        selectedPaydesk = group.paydesks[i];
      }
    }

    res.json(selectedPaydesk);


  });
});

module.exports = router;