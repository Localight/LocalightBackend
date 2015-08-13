var mongoose = require('mongoose');
var Transaction = new mongoose.Schema({
    userId: {
        type: String,
        ref: 'User',
        require:'Please provide the id of the user account'
    },
    locationId: {
        type: String,
        ref: 'Location',
        require:'Please provide the id of the location account'
    },
    amount: {
        type: String,
        require:'Please provide the session token'
    }
});

mongoose.model('Transaction', Transaction);
