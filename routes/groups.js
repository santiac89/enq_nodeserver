var express = require('express');
var router = express.Router();
var number_generator = require('../util/local_number_generator');
var Group = require('../models/group');

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

router.get('/:id/paydesks', function(req, res) {

  Group.findOne({ _id: req.params.id }).exec(function(err, group) {

    if (!group) {
      res.json(404,{});
      return;
    }

    res.json(group.paydesks);

  });

});

router.post('/:id/paydesks', function(req, res) {

  Group.findOne({ _id: req.params.id }).exec(function(err, group) {

    if (!group) {
      res.json(404,{});
      return;
    }

    group.paydesks.push(req.body);
    console.log(group)
    group.save(function(err) {

      if (err)
        res.json(500,err);
      else
        res.json(group.paydesks[group.paydesks.length -1]);

    });

  });

});

router.post('/:id/clients', function(req, res) {

  Group.findOne({_id: req.params.id }, function(err,group) {

      if (!group) {
        res.json(404,err);
        return;
      }

      for (i=0; i < group.clients.length; i++) {
        if (group.clients[i].ip == req.body.ip || group.clients[i].hmac == req.body.hmac ) {
          res.json(500,{});
          return;
        }

      }

      group.clients.push({
        ip: req.body.ip,
        hmac: req.body.hmac,
        number: number_generator.get(),
        enqueue_time: Date.now()
      });

      group.save(function(err,group) {

        if (err) {
            res.json(500,err);
            return;
        }

        res.json({
          estimated_time: 0,
          client_number: group.clients[group.clients.length - 1].number,
          client_id:  group.clients[group.clients.length - 1]._id
        });

      });


  });

});

module.exports = router;
