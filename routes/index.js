var express = require('express');
var router = express.Router();
var passport = require('passport');

router.post('/login', passport.authenticate('local'), function(req, res) {
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
