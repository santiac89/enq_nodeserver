var express = require('express');
app = express();
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
/*
  **** THIRD-PARTY INCLUDES
*/
require('./util/prototypes');
var mongoose = require('mongoose');
var config = require('./config.js');
var engine = require('ejs-locals');
var transaction_logger = require('./util/transaction_logger');

/*
 **** ROUTES INCLUDES *****
*/
var routes = require('./routes/index');
var groups = require('./routes/groups');
var paydesks = require('./routes/paydesks');


/*
 **** THIRD-PARTY CONFIGURATIONS ****
*/
mongoose.connect('mongodb://'+config.mongo.address+':'+config.mongo.port+'/'+config.mongo.db);

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
app.use(express.static(path.join(__dirname, 'public')));

/*
 ***** ROUTES *******
*/
app.use('/', routes);
app.use('/groups', groups);
app.use('/paydesks', paydesks);


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
