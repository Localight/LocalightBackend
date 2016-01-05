var express = require('express');
var cors = require('cors');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

//Database
var mongo = require('mongodb');
var db = require('./models/db');
var users = require('./models/users');
var giftcards = require('./models/giftcards');
var locations = require('./models/locations');
var transactions = require('./models/transactions');
var payouts = require('./models/payouts');
var owners = require('./models/owners');
var admins = require('./models/admins');
var sessions = require('./models/sessions');


if (fs.existsSync("./config/keys.json")) {
    console.log("keys.json found");
} else {
    var content = fs.readFileSync('./config/keys-template.json');
    fs.writeFileSync('./config/keys.json', content);
}

if(process.argv[2]){
    if(process.argv[2].indexOf("http") <= -1 || process.argv[2].slice(-1) == "/"){
        throw new Error("You must pass a valid FRONTEND_BASE parameter!");
    }
} else {
    throw new Error("You must pass a FRONTEND_BASE parameter!");
}

//Routes
var routes = require('./routes/index');
var users = require('./routes/users');
var twilio = require('./routes/twilio');
var owners = require('./routes/owners');
var admins = require('./routes/admins');
var locations = require('./routes/locations');
var giftcards = require('./routes/giftcards');
var transactions = require('./routes/transactions');

//services
var cron = require('./services/cron.js');

var app = express();

//Use cors for cross origin support
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/twilio', twilio);
app.use('/locations', locations);
app.use('/owners', owners);
app.use('/admins', admins);
app.use('/giftcards', giftcards);
app.use('/transactions', transactions);

cron.start();

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

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
