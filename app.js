var express = require('express');
app = express();
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
/*
  **** THIRD-PARTY INCLUDES
*/
require('./util/prototypes');
var mongoose = require('mongoose');
var config = require('./config.js');
var engine = require('ejs-locals');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var MongoSessionStore = require('connect-mongo')(session);

/*
 **** ROUTES INCLUDES *****
*/
var index = require('./routes/index');
var caller = require('./routes/caller');
var admins = require('./routes/admins');
var groups = require('./routes/groups');
var paydesks = require('./routes/paydesks');
var mobile = require('./routes/mobile');
var users = require('./routes/users');

/*
 **** VIEWS CONFIGURATION ****
*/
app.set('env','development');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');

/*
 ***** DEFAULT EXPRESSJS CONFIG *******
*/
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new MongoSessionStore({ mongooseConnection: mongoose.connection })
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

var User = require('./models/user');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

User.findOne({ username: "admin" }).exec(function(err, user) {

  if (!user) {
    User.register(new User({ username: "admin" }), config.admin.password, function(err, user) {
      console.log("Admin user created!");
      User.findOne({ username: "admin" }).exec(function(err, user) {
        user.role = 'admin';
        user.save();
      });
    });
    return;
  }

  user.setPassword(config.admin.password, function() {
    user.save(function(err) {
      console.log("Admin user updated!");
    });
  });

});

/*
 ***** ROUTES *******
*/
app.use('/', index);
app.use('/m', mobile);

app.use(function(req, res, next) {
 if (!req.user) {
    var err = new Error('Not Found ;(');
    err.status = 404;
    next(err);
    return;
  }
  next();
})

app.use('/caller', caller);
app.use('/admin', admins);
app.use('/groups', groups);
app.use('/paydesks', paydesks);
app.use('/users', users);

/*
 **** ERROR HANDLERS CONFIGURATIONS ****
*/
/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        console.log(err.message);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
