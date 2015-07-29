var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    config = require('../config/keys.json'),
    stripe = require("stripe")(config.stripe.accountKey),
    client = require('twilio')(config.twilio.accountSid, config.twilio.authToken),
    Giftcard = mongoose.model('Giftcard'),
    SessionService = require('../services/sessions.js'),
    User = mongoose.model('User');

    /* Create a giftcard */
    router.post('/', function(req, res, next) {
        if(req.body.phone.length > 10 || req.body.phone.length < 10){
            return res.json({msg: "Invalid Phone Number (only xxxxxxxxxx)!",
                    errorid: "774"});
        }

        //Validate session
        SessionService.validateSession(req.body.sessionToken, "user", function(err, accountId){
            if(err){
                res.json(err);
            } else {
                //Find a user with the phone requested. Get the id.
                User.findOne({phone: req.body.phone})
                .select('_id')
                .exec(function(err, user) {
                    if(err){
                      return res.json({msg: "Couldn't search the database for user!",
                              errorid: "774", rawerr: err});
                    } else if(!user){
                        var password = req.body.password;
                        if(!req.body.password){
                            password = "";
                        }
                        //Create a random salt
                        var salt = crypto.randomBytes(128).toString('base64');
                        //Create a unique hash from the provided password and salt
                        var hash = crypto.pbkdf2Sync(password, salt, 10000, 512);
                        //Create a new user with the assembled information
                        var user = new User({
                            name: req.body.name,
                            phone: req.body.phone,
                            password: hash,
                            salt: salt
                        }).save(function(err, user){
                            if(err){
                                console.log("Error saving user to DB!");
                                res.json({msg: "Error saving user to DB!",
                                        errorid: "666"});
                            } else {
                                createGift(accountId, user._id, req);
                            }
                        });
                    } else {
                        createGift(accountId, user._id, req);

                    }
                });
            }
        });

        function createGift(accountId, toId, req){
            if(!accountId ||
            !toId ||
            !req.body.amount || !(req.body.amount > 0) || !(req.body.amount < 50000) ||
            !req.body.iconId ||
            !req.body.message){
                return res.json({msg: "You must provide toId, 0<amount<50000, iconId and message."});
            }

            // Get the credit card details submitted by the form
            var stripeCardToken = req.body.stripeCardToken;

            var stripeError;
            var charge = stripe.charges.create({
            amount: req.body.amount, // amount in cents, again
            currency: "usd",
            source: stripeCardToken,
            description: req.body.message
            }, function(err, charge) {
                if (err && err.type === 'StripeCardError') {
                    stripeError = {msg: "Card was declined!",
                            errorid: "12122"};
                }
            });

            if(stripeError){
                return res.json(stripeError);
            }

            new Giftcard({
                fromId: accountId,
                toId: toId,
                amount: req.body.amount,
                iconId: req.body.iconId,
                message: req.body.message,
                created: Date.now(),
                stripeOrderId: charge.id
            }).save(function(err){
                if(err){
                    res.json({msg: "Error saving giftcard to database!",
                            errorid: "667", rawerr: err});
                } else {
                    //All good, give basic response
                    res.json({msg: "Giftcard was created!"});

                    //Email receipt

                    SessionService.generateSession(toId, "user", function(err, token){
                        if(err){
                            res.json(err);
                        } else {
                            client.messages.create({
                                body: "You have a new giftcard on lbgift! http://lbgift.com/#/giftcards/receive/" + token,
                                to: "+1" + req.body.phone,
                                from: config.twilio.number
                            }, function(err, message) {
                                if(err){
                                    console.log(err);
                                } else {
                                    process.stdout.write(message.sid);
                                }
                            });
                        }
                    });
                }
            });
        }
});

/* Get giftcards */
router.get('/', function(req, res, next) {
    //Validate session
    SessionService.validateSession(req.query.sessionToken, "user", function(err, accountId){
        if(err){
            res.json(err);
        } else {
            Giftcard.find({
                toId: accountId
            })
            //Added toId as we need the client to know the users name
            .select('_id toId fromId amount iconId message')
            //use populate to also returns the users name in the giftcards object!
            .populate('fromId', 'name') // populate the actual user and only return their name
            .populate('toId', 'name') //populate the actual user and only return their name
            .exec(function(err, giftcards) {
                if(err){
                    return res.json({msg: "Couldn't search the database for session!",
                            errorid: "779"});
                } else {
                    res.json(giftcards);
                }
            });
        }
    });
});

/* Get a giftcard */
router.get('/:id', function(req, res, next) {
    SessionService.validateSession(req.query.sessionToken, "user", function(err, accountId){
        if(err){
            res.json(err);
        } else {
            Giftcard.findOne({
                toId: accountId,
                _id: req.params.id
            })
            //added the toId as we need the client to know the users name
            .select('_id toId fromId amount iconId message')
            //use populate to also returns the users name in the giftcards object!
            .populate('fromId', 'name') // populate the actual user and only return their name
            .populate('toId', 'name') //populate the actual user and only return their name
            .exec(function(err, giftcard) {
                if(err){
                    res.json(err);
                } else if(!giftcard){
                    res.json({msg: "No giftard with that ID!",
                        errorid: "39"});
                } else {
                    res.json(giftcard);
                }
            });
        }
    });
});

/* Update a giftcard */
router.put('/:id', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
