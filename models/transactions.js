var mongoose = require('mongoose');
var Transaction = new mongoose.Schema({
    userId: {
        type: String,
        ref: 'User'
    },
    locationId: {
        type: String,
        ref: 'Location'
    },
    amount: {
        type: Number
    },
    errs: [{
        err: {
            type: String
        }
    }],
    paidOut: {
        type: Boolean,
        default: false
    },
    created: {
        type: Date,
        default: Date.now
    }
});

mongoose.model('Transaction', Transaction);
