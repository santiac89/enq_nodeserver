var express = require('express');
var router = express.Router();
var Group = require('../models/group');

router.get('/', function(req, res) {

  Group.find({},'_id name paydesks').exec(function(err, groups) {

    var paydesks = [];

    for (i=0; i < groups.length; i++) {
      for (o=0; o < groups[i].paydesks.length; o++) {

        if (groups[i].paydesks[o].active) continue;

        var paydesk = {};

        paydesk._id =  groups[i].paydesks[o]._id;
        paydesk.number = groups[i].paydesks[o].number;
        paydesk.group_id = groups[i]._id;
        paydesk.group_name = groups[i].name;

        paydesks.push(paydesk);

      }
    }

    res.json(paydesks);

  });

});

router.get('/:id', function(req, res) {

  if (!req.user) res.redirect('/');

  Group.findByPaydesk(req.params.id).exec(function(err,group) {

    if (!group) {
      res.json(404,{});
      return;
    }

    res.json(group.paydesks.id(req.params.id));

  });

});

router.delete('/:id', function(req, res) {

  Group.findByPaydesk(req.params.id).exec(function(err,group) {
    if (err) res.json(404,err);

    paydesk = group.removePaydesk(req.params.id);
    group.save();

    res.json(paydesk);

  });
});



module.exports = router;
