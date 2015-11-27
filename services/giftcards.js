var mongoose = require('mongoose'),
    crypto = require('crypto'),
    config = require('../config/keys.json'),
    client = require('twilio')(config.twilio.accountSid, config.twilio.authToken),
    SessionService = require('../services/sessions.js'),
    shortURLService = require('../services/shortURL.js'),
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
        .populate('toId')
        .populate('fromId')
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
                    var giftcard = giftcards[i];
                    SessionService.generateSession(giftcards[i].toId._id, "user", function(err, token) {
                        if (err) {
                            console.log(err);
                        } else {
                            var toName = giftcard.toId.name;
                            var fromName = giftcard.fromId.name;
                            var amount = giftcard.origAmount;
                            var messages = [
                                "\uD83C\uDF70 " + toName + ", " + fromName + " has sent you a $" + amount + " gift for your birthday! View it here: ",
                                "\uD83D\uDC9E " + toName + ", " + fromName + " has sent you a $" + amount + " gift for your anniversary! View it here: ",
                                "\uD83D\uDC9D " + toName + ", " + fromName + " has sent you a $" + amount + " gift! View it here: ", //Love you
                                "\uD83D\uDE91 " + toName + ", " + fromName + " has sent you a $" + amount + " gift and a note. View it here: ", //Hurt/getwell
                                "\uD83C\uDFC6 " + toName + ", " + fromName + " has sent you a $" + amount + " gift to congratulate you! View it here: ",
                                "\uD83D\uDC8D " + toName + ", " + fromName + " has sent you a $" + amount + " wedding gift card! View it here: ",
                                "\uD83C\uDF7C " + toName + ", " + fromName + " has sent you a $" + amount + " gift for your baby! View it here:",
                                "\uD83D\uDC90 " + toName + ", " + fromName + " has sent you a $" + amount + " gift to cheer you up. View it here: ",
                                "\uD83D\uDE0A " + toName + ", " + fromName + " has sent you a $" + amount + " gift to say thank you! View it here: ",
                                "\uD83C\uDF81 " + toName + ", " + fromName + " has sent you a $" + amount + " gift! View it here: " //Custom
                            ];
                            shortURLService.create(process.argv[2] + "/#/giftcards/" + giftcardId + "?token=" + token, function(url) {
                                client.messages.create({
                                    body: messages[giftcard.iconId] + url,
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
