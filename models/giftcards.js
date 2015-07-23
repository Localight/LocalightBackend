'use strict';
var mongoose = require('mongoose');
var Giftcard = new mongoose.Schema({
    fromId: {
        type: String,
        required: 'fromId is required'
    },
    toId: {
        type: String,
        required: 'toId is required'
    },
    amount: {
        type: Number,
        min: 0,
        max: 50000,
        required: 'amount between 0 and 50000'
    },
    iconId: {
        type: Number
        required: 'iconId is required'
    },
    message: {
        type: String
        required: 'message is required'
    },
    stripeOrderId: {
        type: String
    }
});

mongoose.model('Giftcard', Giftcard);
