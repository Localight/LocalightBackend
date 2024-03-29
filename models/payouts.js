var mongoose = require('mongoose');
var Payout = new mongoose.Schema({
    transactions: [{
        type: String,
        ref: 'Transaction'
    }],
    amount: {
        type: Number
    },
    created: {
        type: Date,
        default: Date.now()
    },
    method: {
        type: String
    },
    locations: [{
        amount: {
            type: Number
        },
        location: {
            type: String,
            ref: 'Location'
        }
    }]
});

mongoose.model('Payout', Payout);
