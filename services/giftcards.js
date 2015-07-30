var mongoose = require('mongoose'),
    crypto = require('crypto'),
    config = require('../config/keys.json'),
    client = require('twilio')(config.twilio.accountSid, config.twilio.authToken),
    Giftcard = mongoose.model('Giftcard');

//Send current giftcards that have today's sendDate
exports.sendCurrent = function(token, type, callback) {
    Giftcard.find({
            sendDate: Date.now(),
            sent: false
        })
        .select('accountId')
        .populate('toId', 'phone') // populate the actual user and only return their name
        .exec(function(err, giftcards) {
            if (err) {
                callback({
                    msg: "Could not search database for giftcards!",
                    status: 500
                }, false);
            } else if (!giftcards) {
                callback({
                    msg: "No giftcards to send.",
                    status: 200
                }, false);
            } else {
                for(giftcard in giftcards){
                    SessionService.generateSession(giftcard.toId._id, "user", function(err, token){
                        if(err){
                            console.log(err);
                        } else {
                            client.messages.create({
                                body: "You have a new giftcard on lbgift! http://lbgift.com/#/giftcards/receive/" + token,
                                to: "+1" + giftcard.toId.phone,
                                from: config.twilio.number
                            }, function(err, message) {
                                if(err){
                                    console.log(err);
                                } else {
                                    console.log(message.sid);
                                }
                            });
                        }
                    });
                }
            }
        });
};
