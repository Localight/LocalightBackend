var mongoose = require('mongoose');
var session = new mongoose.Schema({
    accountId: {
        type: String,
        require:'Please provide the id of the account'
    },
    type: {
        type: String,
        require: "Please provide the type of session"
    },
    token: {
        type: String,
        require: "Please provide the session token"
    }
});

mongoose.model('session', session);
