var express = require('express');
var app = express();

var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


/*
 **** ROUTES INCLUDES *****
*/
var routes = require('./routes/index');
var users = require('./routes/users');
var queues = require('./routes/queues');
var groups = require('./routes/groups');

/*
  **** THIRD-PARTY INCLUDES
*/
var mongoose = require('mongoose');
var config = require('./config.js');
var exphbs  = require('express-handlebars');
 


/*
 **** THIRD-PARTY CONFIGURATIONS ****
*/
var hbs = exphbs.create({defaultLayout: "main"});
/*var passport = require('passport');
var DigestStrategy = require('passport-local').DigestStrategy;*/

mongoose.connect('mongodb://'+config.mongo.address+':'+config.mongo.port+'/'+config.mongo.db);

//app.set('queueList',[{id:1, name:"Cola 1", estimated:20},{id:2, name:"Cola 2", estimated:330}]);

app.engine('handlebars', hbs.engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

/*
 ***** DEFAULT EXPRESSJS CONFIG *******
*/

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


/*
 ***** ROUTES *******
*/
app.use('/', routes);
app.use('/users', users);
app.use('/queues', queues);
app.use('/groups', groups);


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
