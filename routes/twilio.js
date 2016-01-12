var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    config = require('../config/keys.json'),
    SessionService = require('../services/sessions.js'),
    shortURLService = require('../services/shortURL.js'),
    client = require('twilio')(config.twilio.accountSid, config.twilio.authToken),
    mailgun = require('mailgun-js')({apiKey: config.mailgun.apiKey, domain: config.mailgun.domain}),
    mailcomposer = require('mailcomposer'),
    Giftcard = mongoose.model('Giftcard'),
    PromoCode = mongoose.model('PromoCode'),
    Location = mongoose.model('Location'),
    User = mongoose.model('User');

/* Twilio Actions */
router.post('/', function(req, res) {
    //Check if required was sent
    if (!(req.body.Body &&
            req.body.From)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    //Trim phone number
    var phone = req.body.From.substring(2);
    var body = (req.body.Body.toLowerCase()).trim();
    if (body === "gift") {
        //Check if a user with that username already exists
        User.findOne({
                phone: phone
            })
            .select('_id')
            .exec(function(err, user) {
                if (user) {
                    SessionService.generateSession(user._id, "user", function(token) {
                        shortURLService.create(process.argv[2] + '/#/giftcards/create?token=' + token, function(url) {
                            //All good, give the user their token
                            res.send('<Response><Message>Send a new Localight giftcard here: ' + url + '</Message></Response>');
                        });
                    }, function(err){
                        console.log("Twilio pre-exist error: ");
                        console.log(err);
                        twilioError(res, 5989);
                    });
                } else {
                    //Create a new user with the assembled information
                    var user = new User({
                        phone: phone
                    }).save(function(err, user) {
                        if (err) {
                            console.log("Error saving user to DB!");
                            twilioError(res, 5988);
                        } else {
                            SessionService.generateSession(user._id, "user", function(token) {
                                shortURLService.create(process.argv[2] + '/#/giftcards/create?token=' + token, function(url) {
                                    //All good, give the user their token
                                    res.send('<Response><Message>Send a new Localight giftcard here: ' + url + '</Message></Response>');
                                });
                            }, function(err){
                                console.log("Twilio not-exist error: ");
                                console.log(err);
                                twilioError(res, 5987);
                            });
                        }
                    });
                }
            });
    }
    if (body === "giftcards" || body === "giftcard" || body === "balance") {
        //Check if a user with that username already exists
        User.findOne({
                phone: phone
            })
            .select('_id')
            .exec(function(err, user) {
                if (user) {
                    SessionService.generateSession(user._id, "user", function(token) {
                        shortURLService.create(process.argv[2] + '/#/giftcards?token=' + token, function(url) {
                            //All good, give the user their token
                            res.send('<Response><Message>Access your giftcards and balance here: ' + url + '</Message></Response>');
                        });
                    }, function(err){
                        console.log("Twilio pre-exist error: ");
                        console.log(err);
                        twilioError(res, 5989);
                    });
                } else {
                    //Create a new user with the assembled information
                    var user = new User({
                        phone: phone
                    }).save(function(err, user) {
                        if (err) {
                            console.log("Error saving user to DB!");
                            twilioError(res, 5988);
                        } else {
                            SessionService.generateSession(user._id, "user", function(token) {
                                shortURLService.create(process.argv[2] + '/#/giftcards?token=' + token, function(url) {
                                    //All good, give the user their token
                                    res.send('<Response><Message>Access your giftcards and balance here: ' + url + '</Message></Response>');
                                });
                            }, function(err){
                                console.log("Twilio not-exist error: ");
                                console.log(err);
                                twilioError(res, 5987);
                            });
                        }
                    });
                }
            });
    }

    //------ Promo Keywords ------

    var lbpost12 = body === "lbpost12";
    var csulb = body === "csulb";
    var woodenmap17 = body === "woodenmap17" || body === "woodmap17";
    var promoSMS = "";

    checkUser(phone, null, null, function(user){
        PromoCode.findOne({
            keyword: body
        }).exec(function(err, promo){
            if(err){
                twilioError(res, 4130);
            } else if(!promo){
                twilioStandard(res);
            } else {
                if(getPromoUsed(user._id, promo.usedBy)){
                    twilioStandard(res);
                } else {
                    checkUser(promo.from.phone, promo.from.name, null, function(user){
                        
                    }, function(err){
                        twilioError(res, 2141);
                    });
                }
            }
        });
    }, function(err){
        console.log(err);
        twilioError(res, 1441);
    });

    function getPromoUsed(userId, usedBy){
        for(usedById in usedBy){
            if(usedById == userId){
                return true;
            }
        }
        return false;
    }

    function checkUser(phone, name, email, success, fail){
        User.findOne({
                phone: phone
            })
            .select('_id')
            .exec(function(err, user) {
                if (err){
                    fail("Database error");
                } else if (user) {
                    success(user);
                } else {
                    var newUser = {
                        phone: phone
                    }
                    if(name) newUser.name = name;
                    if(email) newUser.email = email;
                    //Create a new user with the assembled information
                    var user = new User(newUser).save(function(err, user) {
                        if (err) {
                            console.log("Error saving user to DB!");
                            fail("Database error");
                        } else {
                            success(user);
                        }
                    });
                }
            });
    }




        var promoText = "";
        var promoAmount = 0;
        var notes = "";
        var promoSender = "Localight";
        var promoPhone = "0000000000";
        if(lbpost12){
            promoText = "As a thank you for reading The Post this year, enjoy $10 towards a purchase of $30 or more at MADE in Long Beach, with products from over 100 local makers. #shoplocal";
            promoSMS = "\uD83C\uDF81 Enjoy this $10 giftcard towards your purchase of $30 or more at MADE in Long Beach: ";
            promoAmount = 1000;
            notes = "LBPOST12";
            promoSender = "Long Beach Post";
            promoPhone = "0000000001";
        } else if(csulb){
            promoText = "A promotional giftcard for CSULB students like you to beta test The Local Giftcard!";
            promoSMS = "Please enjoy this $5 giftcard for CSULB students like you, valid at MADE in Long Beach: ";
            promoAmount = 500;
            notes = "CSULB";
            promoSender = "The Local Giftcard";
            promoPhone = "0000000000";
        } else if(woodenmap17){
            promoText = "Our aplogizes for not having your wooden map available before the holidays. Please enjoy this $10 giftcard valid at MADE in Long Beach.";
            promoSMS = "Please enjoy this $10 giftcard as our apology, valid at MADE in Long Beach: ";
            promoAmount = 1000;
            notes = "WOODENMAP17";
            promoSender = "The Local Giftcard";
            promoPhone = "0000000000";
        }
        //Assemble created information
        var gcDetails = {};
        gcDetails.toId = user._id;
        gcDetails.amount = promoAmount;
        gcDetails.iconId = 9;
        gcDetails.locationId = 10000;
        gcDetails.message = promoText;
        gcDetails.stripeCardToken = "None";
        gcDetails.notes = notes;



        function continuePromo(gcDetails, res){
            SessionService.generateSession(gcDetails.toId, "user", function(token) {
                Location.findOne({
                        ownerCode: "10000"
                    })
                    .select('_id')
                    .exec(function(err, location) {
                        if (err) {
                            twilioError(res, 4410);
                        } else if (location) {
                            new Giftcard({
                                fromId: gcDetails.fromId,
                                toId: gcDetails.toId,
                                amount: gcDetails.amount,
                                origAmount: gcDetails.amount,
                                iconId: gcDetails.iconId,
                                message: gcDetails.message,
                                stripeOrderId: "",
                                location: {
                                    locationId: location._id
                                },
                                created: Date.now(),
                                sendDate: Date.now(),
                                sent: true,
                                notes: gcDetails.notes
                            }).save(function(err, giftcard) {
                                if (err) {
                                    twilioError(res, 3150);
                                } else {
                                    shortURLService.create(process.argv[2] + "/#/giftcards/" + giftcard._id + "?token=" + token, function(url) {
                                        //All good, give the user their card
                                        var promoText = lbpost12 ? "\uD83C\uDF81 Enjoy this $10 giftcard towards your purchase of $30 or more at MADE in Long Beach: " : "Enjoy this $5 giftcard for CSULB students like you, valid at MADE in Long Beach: ";
                                        twilioResponse(res, promoText + url);
                                    });
                                }
                            });
                        } else {
                            console.log("Couldn't query the database for MADE location 10000! Perhaps it doesn't exist?");
                            twilioError(res, 2550);
                        }
                    });
            }, function(err){
                res.status(err.status).json(err);
            });
        }

    function twilioError(res, err){
        res.send('<Response><Message>Our apologies, we had a problem. Please try texting us again or contact our development team. Error ID: ' + err + '</Message></Response>');
    }
    function twilioResponse(res, msg){
        res.send('<Response><Message>' + msg + '</Message></Response>');
    }
    function twilioStandard(res){
        res.send("<Response><Message>Thank you for being a Localight! Please text 'Gift' to send a giftcard, or 'Giftcards' to access your giftcards.</Message></Response>");
    }
});

module.exports = router;
