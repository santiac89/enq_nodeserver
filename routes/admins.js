var express = require('express');
var router = express.Router();
var Group = require('../models/group');

router.get('/groups', function(req, res) {

  if (!req.user) res.redirect("/admin");

  Group.find().exec(function(err,groups) {
      res.render('admin/groups',{groups: groups, user: req.user });
    });
});

router.get('/paydesks', function(req, res) {

   if (!req.user) res.redirect("/admin");

  Group.find({},'_id name').exec(function(err, groups) {
       res.render('admin/paydesks',{ groups: groups, user: req.user });
  });
});

module.exports = router;
