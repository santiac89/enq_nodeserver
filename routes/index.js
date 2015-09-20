var express = require('express');
var router = express.Router();
var Paydesk = require('../models/paydesk');
var Group = require('../models/group');
var Client = require('../models/client');
/* GET home page. */

router.get('/', function(req, res) {
  Group.findOne().exec(function(err, group) {
    paydesk = group.paydesks[0];

    paydesk.number = 1;

    group.save();

  });
});

router.get('/admin', function(req, res) {
  res.render('adminangular');
});

router.get('/admin/groups', function(req, res) {
  Group.find().exec(function(err,groups) {
      res.render('admin/groups',{groups: groups});
    });
});

router.get('/admin/paydesks', function(req, res) {
  Group.find({},'_id name').exec(function(err, groups) {
       res.render('admin/paydesks',{ groups: groups });
  });
});

router.get('/caller', function(req, res) {

  Group.findByPaydeskNumber(1).exec(function(err,group) {

    for (i=0; i < group.paydesks.length; i++) {
      if (group.paydesks[i].number == 1) {
          res.render('caller',{ group: group, paydesk: group.paydesks[i] });
          return;
      }
    }


  });
});

module.exports = router;
