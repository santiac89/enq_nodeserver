var express = require('express');
var router = express.Router();
var Group = require('../models/group');
var User = require('../models/user');

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

router.use(function(req, res, next) {
 if (!req.user || req.user.username != "admin") {
    var err = new Error('Not Found ;(');
    err.status = 404;
    next(err);
    return;
  }
  next();
})

router.get('/users', function(req, res) {
  User.find({},'_id username role').exec(function(err, users) {
    res.render('admin/users', { user: req.user, users: users });
  });
});

router.get('/reset', function(req, res) {
  Group.find({}).exec(function(err, groups) {

    groups.forEach((group) => {
      group.confirmed_clients = group.confirmed_times = 0;
      group.paydesks.forEach((paydesk) => {
        paydesk.called_client = paydesk.current_client = [];
      });
      group.clients = [];
      group.save();
    });

    res.redirect("/");
  });
});

module.exports = router;
