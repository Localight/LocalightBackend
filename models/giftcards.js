'use strict';
var mongoose = require('mongoose');
var Giftcard = new mongoose.Schema({
    fromId: {
        type: String,
        ref: 'User',
        required: 'fromId is required'
    },
    toId: {
        type: String,
        ref: 'User',
        required: 'toId is required'
    },
    amount: {
        type: Number,
        min: 0,
        max: 50000,
        required: 'amount between 0 and 50000'
    },
    iconId: {
        type: Number,
        required: 'iconId is required'
    },
    message: {
        type: String,
        required: 'message is required'
    },
    stripeOrderId: {
        type: String,
        match: [/ch_[\w\d._%+-]+/, 'This value entered for the stripeId does not match ({VALUE})'],
        required: 'please enter a stripe order id'
    },
    sendDate: {
        type: Date,
        default: Date.now()
    },
    sent: {
        type: Boolean,
        default: false
    }
});

mongoose.model('Giftcard', Giftcard);
