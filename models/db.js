var mongoose = require('mongoose');
var config = require('../config/keys.json');

var options = {
    user: config.db.username,
    pass: config.db.password
}

mongoose.connect('mongodb://localhost/localight', options);
