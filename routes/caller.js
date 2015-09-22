var express = require('express');
var router = express.Router();
var Group = require('../models/group');
var User = require('../models/user');
var passport = require('passport');

router.get('/:id', function(req, res) {

  if (!req.user) res.redirect('/admin');

  Group.findByPaydesk(req.params.id).exec(function(err,group) {

    if (!group) {
      res.json(404,{});
      return;
    }

    res.render('caller',{ group: group, paydesk: group.paydesks.id(req.params.id), user: req.user });

  });

});

module.exports = router;
