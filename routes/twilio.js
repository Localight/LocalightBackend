var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    config = require('../config/keys.json'),
    env = config.environments[process.env.ENV],
    SessionService = require('../services/sessions.js'),
    shortURLService = require('../services/shortURL.js'),
    twilio = require('twilio'),
    client = require('twilio')(config.twilio.accountSid, config.twilio.authToken),
    mailgun = require('mailgun-js')({apiKey: config.mailgun.apiKey, domain: config.mailgun.domain}),
    mailcomposer = require('mailcomposer'),
    Giftcard = mongoose.model('Giftcard'),
    PromoCode = mongoose.model('PromoCode'),
    Location = mongoose.model('Location'),
    User = mongoose.model('User'),
    PromoCode = mongoose.model('PromoCode');

/* Twilio Actions */
router.post('/', twilio.webhook(config.twilio.authToken, {  validate: env.twilioAuth }), function(req, res) {
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

    checkUser(phone, null, null, function(user){
        SessionService.generateSession(user._id, "user", function(token) {
            if (body === "gift") {
                shortURLService.create(env.frontendURL + '/#/giftcards/create?token=' + token, function(url) {
                    //All good, give the user their token
                    res.send('<Response><Message>Send a new Localight giftcard here: ' + url + '</Message></Response>');
                });
            } else if (body === "giftcards" || body === "giftcard" || body === "balance") {
                shortURLService.create(env.frontendURL + '/#/giftcards?token=' + token, function(url) {
                    //All good, give the user their token
                    res.send('<Response><Message>Access your giftcards and balance here: ' + url + '</Message></Response>');
                });
            } else {
                body = body.replace(/\s/g, '');

                //------ Promo Keywords ------
                //Check if user has entered a promocode
                PromoCode.findOne({
                    keyword: body
                }).exec(function(err, promo){
                    if(err){
                        twilioError(res, 4130);
                    } else if(!promo){
                        //User has not entered a valid command or promocode
                        twilioStandard(res);
                    } else {
                        //Check if user has already used promocode
                        if(getPromoUsed(user._id, promo.usedBy)){
                            //User has used promocode previously
                            twilioStandard(res);
                        } else {
                            //User permitted to use promocode! Mark for future
                            console.log(user._id);
                            PromoCode.findByIdAndUpdate(promo._id, { $push: { usedBy: user._id }}, {safe: true, upsert: false}, function(result){
                                console.log("Success! " + result);
                            }, function(err){
                                console.log("Error saving promocode used! " + err);
                            });
                            //Check/Generate the promotional sender
                            checkUser(promo.from.phone, promo.from.name, null, function(promoSender){
                                //Find the promotional location
                                Location.findOne({
                                        ownerCode: promo.locationCode
                                    })
                                    .select('_id')
                                    .exec(function(err, location) {
                                        if (err) {
                                            twilioError(res, 4410);
                                        } else if (location) {
                                            new Giftcard({
                                                fromId: promoSender._id,
                                                toId: user._id,
                                                amount: promo.amount,
                                                origAmount: promo.amount,
                                                iconId: 9,
                                                message: promo.message,
                                                stripeOrderId: "",
                                                location: {
                                                    locationId: location._id
                                                },
                                                created: Date.now(),
                                                sendDate: Date.now(),
                                                sent: true,
                                                notes: promo.keyword
                                            }).save(function(err, giftcard) {
                                                if (err) {
                                                    twilioError(res, 3150);
                                                } else {
                                                    shortURLService.create(env.frontendURL + "/#/giftcards/" + giftcard._id + "?token=" + token, function(url) {
                                                        //All good, give the user their card
                                                        twilioResponse(res, promo.sms + url);
                                                    });
                                                }
                                            });
                                        } else {
                                            console.log("Couldn't query the database for merchant location: " + promo.locationCode + "! Perhaps it doesn't exist?");
                                            twilioError(res, 2550);
                                        }
                                    });
                            }, function(err){
                                twilioError(res, 1551);
                            });
                        }
                    }
                });
            }
        }, function(err){
            console.log(err);
            twilioError(res, 5987);
        });
    }, function(err){
        console.log(err);
        twilioError(res, 1441);
    });

    function getPromoUsed(userId, usedBy){
        for(var i=0;i<usedBy.length;i++){
            if(usedBy[i] == userId){
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
