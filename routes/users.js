var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var config = require('../config');
var Logger = require('../util/logger');

router.use(function(req, res, next) {
 if (!req.user || req.user.username != "admin") {
    var err = new Error('Not Found ;(');
    err.status = 404;
    next(err);
    return;
  }
  next();
})

router.get('/', function(req, res) {
  User.find({},'_id username role').exec(function(err, users) {
    if (err) {
      Logger.error(err);
      return res.status(500).end();
    }

    res.json(users);
  });
});

router.delete('/:id', function(req, res) {
  User.findOne({ _id: req.params.id }).exec(function(err, user) {

    if (!user) return res.status(404).end();

    if (err) {
      Logger.error(err);
      return res.status(500).end();
    }

    user.remove();
    res.json(user);
  });
});

router.post('/', function(req, res, next) {
  User.register(new User({ username: req.body.username }), req.body.password, function(err, user) {

    if (err) {
      Logger.error(err);
      return res.status(500).end();
    }

    user.role = req.body.role;
    user.save(function(err, user) {
      if (err) {
       Logger.error(err);
        return res.status(500).end();
      }

      Logger.debug('User registered!');
      res.json(user);
    });
  });
});

router.put('/:id', function(req, res) {
  User.findOne({_id: req.params.id }).exec(function(err, user) {

    if (!user) return res.status(404).end();

    if (err) {
      Logger.error(err);
      return res.status(500).end();
    }

    user.username = req.body.username;
    user.role = req.body.role;

    user.setPassword(req.body.password, function() {
      user.save(function(err) {
        if (err) {
          Logger.error(err);
          return res.status(500).end();
        }
        res.json(user);
      });
    });

  });
});

module.exports = router;
