'use strict';
var mongoose = require('mongoose');
var Giftcard = new mongoose.Schema({
    fromId: {
        type: String,
        required: 'Please, enter the user id to send this giftcard too.'
    },
    toId: {
        type: String,
        required: 'Please, enter the user id who is sending the giftcard.'
    },
    amount: {
        type: Number,
        min: 0,
        max: 50000,
        require: 'Please enter an amount to purchase between 0 and 50000'
    },
    iconId: {
        type: Number
    },
    message: {
        type: String
            //TODO: create limit for how long text can be.
    },
    stripeOrderId: {
        type: String
    }
});

mongoose.model('Giftcard', Giftcard);
