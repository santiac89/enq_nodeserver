var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var config = require('../config');

router.use(function(req, res, next) {
 if (!req.user || req.user.username != "admin") {
    var err = new Error('Not Found ;(');
    err.status = 404;
    next(err);
    return;
  }
  next();
})

User.findOne({ username: "admin" }).exec(function(err, user) {

  if (!user) {
    User.register(new User({ username: "admin" }), config.admin.password, function(err, user) {
      console.log("Admin user created!");
    });
    return;
  }

  user.setPassword(config.admin.password, function() {
    user.save(function(err) {
      console.log("Admin user updated!");
    });
  });

});

router.get('/', function(req, res) {
  User.find({},'_id username role').exec(function(err, users) {
    res.json(users);
  });
});

router.delete('/:id', function(req, res) {
  User.findOne({ _id: req.params.id }).exec(function(err, user) {

    if (err) {
      res.json(404,err);
      return;
    }

    user.remove();
    res.json(user);
  });
});

router.post('/', function(req, res, next) {
  User.register(new User({ username: req.body.username }), req.body.password, function(err, user) {


    if (err) {
      console.log('error while user register!', err);
      return next(err);
    }

    user.role = req.body.role;
    user.save();

    console.log('user registered!');

    res.json(user);
  });
});

module.exports = router;
