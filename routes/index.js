var express = require('express');
var router = express.Router();
var Paydesk = require('../models/paydesk');
var Group = require('../models/group');

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

module.exports = router;
