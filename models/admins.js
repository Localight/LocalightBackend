var mongoose = require('mongoose');
var Admin = new mongoose.Schema({
    name: {
        type: String,
        require: 'Please provide the name of the owner'
    },
    email: {
        type: String,
        require: 'Please provide the email of the owner'
    },
    password: {
        type: String,
        require: 'Please provide the password hash of the owner'
    },
    salt: {
        type: String,
        require: 'Please provde the salt for the owner'
    }
});

mongoose.model('Admin', Admin);
