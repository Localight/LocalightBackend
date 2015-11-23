var mongoose = require('mongoose'),
    crypto = require('crypto'),
    config = require('../config/keys.json'),
    client = require('twilio')(config.twilio.accountSid, config.twilio.authToken),
    SessionService = require('../services/sessions.js'),
    Giftcard = mongoose.model('Giftcard');

//Send current giftcards that have today's sendDate
exports.sendCurrent = function(callback) {
    Giftcard.find({
            sendDate: {
                $lt: Date.now()
            },
            sent: false
        })
        .select('toId')
        .populate('toId', 'phone') // populate the actual user and only return their name
        .exec(function(err, giftcards) {
            if (err) {
                callback({
                    msg: "Could not search database for giftcards!",
                    status: 500
                });
            } else if (!giftcards) {
                callback({
                    msg: "No giftcards to send.",
                    status: 200
                });
            } else {
                for (var i = 0; i < giftcards.length; i++) {
                    console.log("sending");
                    console.log(giftcards[i]);
                    var toPhone = giftcards[i].toId.phone;
                    var giftcardId = giftcards[i]._id;
                    SessionService.generateSession(giftcards[i].toId._id, "user", function(err, token) {
                        if (err) {
                            console.log(err);
                        } else {
                            client.messages.create({
                                body: "You have a new giftcard on lbgift! http://lbgift.com/#/giftcards/receive/" + token,
                                to: "+1" + toPhone,
                                from: config.twilio.number
                            }, function(err, message) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    var sentGiftcard = {};

                                    sentGiftcard.sent = true;

                                    var setGiftcard = {
                                        $set: sentGiftcard
                                    }

                                    Giftcard.update({
                                            _id: giftcardId
                                        }, setGiftcard)
                                        .exec(function(err, giftcard) {
                                            if (err) {
                                                console.log({
                                                    msg: "Could not save sent giftcard",
                                                    status: 500
                                                });
                                            } else {
                                                console.log({
                                                    status: 200
                                                });
                                            }
                                        })
                                    console.log(message.sid);
                                }
                            });
                        }
                    });
                }
                callback({
                    msg: "Complete",
                    status: 200
                });
            }
        });
};
