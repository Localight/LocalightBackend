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
router.post('/', function(req, res) {
    //Check if required was sent
    if (!(req.body.sessionToken &&
            req.body.name &&
            req.body.phone &&
            req.body.amount && req.body.amount > 0 && req.body.amount < 50000 &&
            req.body.iconId &&
            req.body.message &&
            req.body.stripeCardToken)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    if (req.body.phone.length != 10) {
        return res.status(412).json({
            msg: "Invalid Phone Number (only xxxxxxxxxx)!"
        });
    }

    //Validate session
    SessionService.validateSession(req.body.sessionToken, "user", function(err, accountId) {
        if (err) {
            res.json(err);
        } else {
            //Find a user with the phone requested. Get the id.
            User.findOne({
                    phone: req.body.phone
                })
                .select('_id')
                .exec(function(err, user) {
                    if (err) {
                        return res.status().json({
                            msg: "Couldn't search the database for user!"
                        });
                    } else if (!user) {
                        var user = new User({
                            name: req.body.name,
                            phone: req.body.phone
                        }).save(function(err, user) {
                            if (err) {
                                console.log("Error saving user to DB!");
                                res.status(500).json({
                                    msg: "Error saving user to DB!"
                                });
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

    function createGift(accountId, toId, req) {
        if (!accountId || !toId) {
            return res.status(412).json({
                msg: "You must provide toId, 0<amount<50000, iconId and message."
            });
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
                stripeError = {
                    msg: "Card was declined!"
                };
            }
        });

        if (stripeError) {
            return res.status(412).json(stripeError);
        }

        var sent = !(req.body.sendDate && req.body.sendDate != Date.now());

        var sendDate;
        if (req.body.sendDate) {
            sendDate = req.body.sendDate;
        } else {
            sendDate = Date.now();
        }

        new Giftcard({
            fromId: accountId,
            toId: toId,
            amount: req.body.amount,
            origAmount: req.body.amount,
            iconId: req.body.iconId,
            message: req.body.message,
            stripeOrderId: charge.id,
            sendDate: req.body.sendDate,
            sent: sent
        }).save(function(err) {
            if (err) {
                res.status(500).json({
                    msg: "Error saving giftcard to database!"
                });
            } else {
                //All good, give basic response
                res.status(201).json({
                    msg: "Giftcard was created!"
                });

                //Email receipt

                if (sent) {
                    SessionService.generateSession(toId, "user", function(err, token) {
                        if (err) {
                            console.log(err);
                        } else {
                            client.messages.create({
                                body: "You have a new giftcard on lbgift! http://lbgift.com/#/giftcards/receive/" + token,
                                to: "+1" + req.body.phone,
                                from: config.twilio.number
                            }, function(err, message) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(message.sid);
                                }
                            });
                        }
                    });
                } else {
                    console.log("Added giftcard to send queue");
                }
            }
        });
    }
});

/* Get giftcards */
router.get('/', function(req, res) {
    //Check if required was sent
    if (!req.query.sessionToken) {
        return res.status(412);
    }

    //Validate session
    SessionService.validateSession(req.query.sessionToken, "user", function(err, accountId) {
        if (err) {
            res.status(err.status);
        } else {
            Giftcard.find({
                    toId: accountId
                })
                //Added toId as we need the client to know the users name
                .select('_id toId fromId amount origAmount iconId message')
                //use populate to also returns the users name in the giftcards object!
                .populate('fromId', 'name') // populate the actual user and only return their name
                .populate('toId', 'name') //populate the actual user and only return their name
                .exec(function(err, giftcards) {
                    if (err) {
                        return res.status(500);
                    } else {
                        res.status(200).json(giftcards);
                    }
                });
        }
    });
});

/* Get a giftcard */
router.get('/:id', function(req, res) {
    //Check if required was sent
    if (!req.query.sessionToken) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    SessionService.validateSession(req.query.sessionToken, "user", function(err, accountId) {
        if (err) {
            res.json(err);
        } else {
            Giftcard.findOne({
                    toId: accountId,
                    _id: req.params.id
                })
                //added the toId as we need the client to know the users name
                .select('_id toId fromId amount origAmount iconId message')
                //use populate to also returns the users name in the giftcards object!
                .populate('fromId', 'name') // populate the actual user and only return their name
                .populate('toId', 'name') //populate the actual user and only return their name
                .exec(function(err, giftcard) {
                    if (err) {
                        res.status(500).json(err);
                    } else if (!giftcard) {
                        res.status(404).json({
                            msg: "No giftard with that ID!"
                        });
                    } else {
                        res.status(200).json(giftcard);
                    }
                });
        }
    });
});

/* Update a giftcard */
router.put('/:id', function(req, res) {
    //Logic goes here
});

module.exports = router;
