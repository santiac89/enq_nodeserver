var express = require('express');
var router = express.Router();
var Group = require('../models/group');

router.get('/groups', function(req, res) {
  Group.find().exec(function(err,groups) {
      res.render('admin/groups',{groups: groups, user: req.user });
    });
});

router.get('/paydesks', function(req, res) {
  Group.find({},'_id name').exec(function(err, groups) {
       res.render('admin/paydesks',{ groups: groups, user: req.user });
  });
});

router.get('/viewer', function(req, res) {
  res.render('admin/viewer',{ user: req.user });
});

module.exports = router;
