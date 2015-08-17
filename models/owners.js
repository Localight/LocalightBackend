var mongoose = require('mongoose');
var Owner = new mongoose.Schema({
    name: {
        type: String,
        require: 'Please provide the name of the owner'
    },
    type: {
        type: String,
        require: 'Please provide the type of owner'
    }
    triconKey: {
        type: String,
        require: 'Please provide the tricon key of the owner'
    },
    code: {
        type: String,
        require: 'Please provide the code for the owner'
    }
    stripeCustomerId: {
        type: String,
        require: 'Please provide the Stripe customer id of the owner'
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
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
    }
});

mongoose.model('Owner', Owner);
