var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var queues = require('./routes/queues');
var groups = require('./routes/groups');

var app = express();
var passport = require('passport');
var DigestStrategy = require('passport-local').DigestStrategy;
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/enq');

app.set('queueList',[{id:1, name:"Cola 1", estimated:20},{id:2, name:"CAola 2", estimated:330}]);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/*passport.use(new DigestStrategy({ qop: 'auth' },
  function(username, done) {
   
      return done(null, user, user.password);
   
  },
  function(params, done) {
    // validate nonces as necessary
    done(null, true)
  }
));*/

app.use('/', routes);
app.use('/users', users);
app.use('/queues', queues);
app.use('/groups', groups);

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
