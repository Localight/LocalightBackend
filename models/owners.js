var mongoose = require('mongoose');
var Owner = new mongoose.Schema({
    name: {
        type: String,
        require: 'Please provide the name of the owner'
    },
    type: {
        type: String,
        require: 'Please provide the type of owner'
    },
    company: {
        type: String
    },
    stripeCustomerId: {
        type: String
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
    },
    verified: {
        type: Boolean,
        default: false
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
    }
});

mongoose.model('Owner', Owner);
