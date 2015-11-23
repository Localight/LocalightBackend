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
    merchants: [{}]
});

mongoose.model('Payout', Payout);
