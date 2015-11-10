var mongoose = require('mongoose');
var Transaction = new mongoose.Schema({
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
    }
});

mongoose.model('Transaction', Transaction);
