var express = require('express');
var router = express.Router();
var Paydesk = require('../models/paydesk');
var Group = require('../models/group');
var Client = require('../models/client');
/* GET home page. */



router.get('/admin', function(req, res) {
  res.render('adminangular');
});

router.get('/admin/groups', function(req, res) {
  Group.find().exec(function(err,groups) {
      res.render('admin/groups',{groups: groups});
    });
});

router.get('/admin/paydesks', function(req, res) {
  Paydesk.find().populate('group').exec(function(err,paydesks) {
    Group.find().exec(function(err,groups) {
      res.render('admin/paydesks',{paydesks : paydesks, groups: groups});
    });
  });
});

router.get('/caller', function(req, res) {
  Paydesk.findOne({number: 10}).populate('group').exec(function(err,paydesk) {
    res.render('caller',{paydesk: paydesk});
  });
});

module.exports = router;
