var mongoose = require('mongoose'),
Session = mongoose.model('Session');

//Checks if a token exists, and returns the corrosponding accountId
exports.validateSession = function(token, type, callback) {
        Session.findOne({
                token: token,
                type: type
            })
            .select('accountId')
            .exec(function(err, session) {
                    if (err) {
                        callback({msg: "Could not search database for session!", errorid: 779},false);
                    } else if (!session) {
                        callback({msg: "Session is not valid!", errorid: 34},false);
                    } else {
                        callback(null,session.accountId);
                    }
                });
            };
