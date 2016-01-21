var mongoose = require('mongoose');
var promoCode = new mongoose.Schema({
    usedBy: [{
        type: String,
        ref: 'User'
    }],
    amount: {
        type: Number
    },
    created: {
        type: Date,
        default: Date.now()
    },
    keyword: {
        type: String
    },
    message: {
        type: String
    },
    sms: {
        type: String
    },
    notes: {
        type: String
    },
    from: {
        name: {
            type: String
        },
        phone: {
            type: String
        }
    },
    locationCode: {
        type: String
    }
});

mongoose.model('PromoCode', promoCode);
