var express = require('express');
var router = express.Router();
var Group = require('../models/group');
var Paydesk = require('../models/paydesk');

router.get('/', function(req, res) {
  Paydesk.find({}).populate('group').exec(function(err, paydesks) {
    if (!paydesks || err) return res.json(404, err);
    res.json(paydesks);
  });
});

router.get('/:id', function(req, res) {

  if (!req.user) res.redirect('/');

  Paydesk.findOne(req.params.id).populate('group').exec(function(err, paydesk) {
    if (!paydesk || err) return res.json(404, err);
    res.json(paydesk);
  });

});

router.delete('/:id', function(req, res) {
  Paydesk.findOne(req.params.id).exec(function(err, paydesk) {
    if (!paydesk) return res.json(404, err);

    paydesk.active = false
    paydesk.save();

    res.json(paydesk);
  });
});



module.exports = router;
