var mongoose = require('mongoose'),
    crypto = require('crypto'),
    Session = mongoose.model('Session');

//Checks if a token exists, and returns the corrosponding accountId
exports.validateSession = function(token, type, callback) {
    Session.findOne({
            token: token,
            type: type
        }).select('accountId')
        .exec(function(err, session) {
            if (err) {
                callback({
                    msg: "Could not search database for session!",
                    status: 500
                }, false);
            } else if (!session) {
                callback({
                    msg: "Session is not valid!",
                    status: 401
                }, false);
            } else {
                callback(null, session.accountId);
            }
        });
};

//Creates a token and returns the token if successful
exports.generateSession = function(accountId, type, callback) {
    //Create a random token
    var token = crypto.randomBytes(48).toString('hex');
    //New session!
    new Session({
        accountId: accountId,
        type: type,
        token: token,
        created: Date.now()
    }).save(function(err) {
        if (err) {
            callback({
                msg: "Could not add session to DB!",
                status: 500
            }, false);
        } else {
            callback(null, token);
        }
    });
};
