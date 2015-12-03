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
    merchants: [{
        amount: {
            type: Number
        },
        merchant: {
            type: String,
            ref: 'Location'
        }
    }]
});

mongoose.model('Payout', Payout);
