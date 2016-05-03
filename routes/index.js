var express = require('express');
var router = express.Router();
var passport = require('passport');
var Paydesk = require('../models/paydesk');
var Logger = require('../util/logger');

router.post('/caller/login', passport.authenticate('local'), function(req, res) {
  Paydesk.find({}).populate('group').exec(function(err, paydesks) {

    if (!paydesks) return res.status(404).end();

    if (err) {
      Logger.error(err);
      return res.status(500).end();
    }

    res.json(paydesks[0]);
  });
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/' }), function(req, res) {
    res.redirect('/');
});

router.get('/', function(req, res) {
    if (req.user) {
      res.render('index', { user: req.user });
    } else {
      res.render('login',{ user: req.user });
    }
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
