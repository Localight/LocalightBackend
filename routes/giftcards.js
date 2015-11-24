var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    config = require('../config/keys.json'),
    stripe = require("stripe")(config.stripe.secretKey),
    client = require('twilio')(config.twilio.accountSid, config.twilio.authToken),
    Giftcard = mongoose.model('Giftcard'),
    nodemailer = require('nodemailer'),
    SessionService = require('../services/sessions.js'),
    shortURLService = require('../services/shortURL.js'),
    User = mongoose.model('User');

/* Create a giftcard */
router.post('/', function(req, res) {
    //Check if required was sent
    if (!(req.body.sessionToken &&
            req.body.toName &&
            req.body.fromName &&
            req.body.email &&
            req.body.phone &&
            req.body.amount && req.body.amount > 0 && req.body.amount <= 50000 &&
            req.body.iconId &&
            req.body.locationId &&
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
                        return res.status(500).json({
                            msg: "Couldn't search the database for user!"
                        });
                    } else if (!user) {
                        var user = new User({
                            name: req.body.toName,
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
                msg: "You must provide toId, 0<amount<=50000, iconId and message."
            });
        }

        // Get the credit card details submitted by the form
        var stripeCardToken = req.body.stripeCardToken;

        var stripeError;
        var charge = stripe.charges.create({
            amount: req.body.amount, // amount in cents, again
            currency: "usd",
            source: stripeCardToken,
            description: "LBGift Giftcard"
        }, function(err, charge) {
            if (err && err.type === 'StripeCardError') {
                res.status(412).json({
                    msg: "Card was declined!"
                });
            } else if (err) {
                console.log("Stripe charge error");
                res.status(500).json({
                    msg: "Charge could not be completed!"
                });
            } else {
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
                    location: {
                        locationId: req.body.locationId,
                        subId: req.body.subId
                    },
                    created: Date.now(),
                    sendDate: req.body.sendDate,
                    sent: sent
                }).save(function(err, giftcard) {
                    if (err) {
                        res.status(500).json({
                            msg: "Error saving giftcard to database!"
                        });
                    } else {
                        //All good, give basic response
                        res.status(201).json({
                            msg: "Giftcard was created!"
                        });

                        var messagePlain = "Hello " + req.body.fromName + ", Here is a receipt for your LBGift order. $" + (req.body.amount / 100) + " sent to " + req.body.toName + " " + req.body.phone + ". Thank you!, LBGift.";
                        var messageHTML = "Hello " + req.body.fromName + ",<br /><br />Here is a receipt for your LBGift order:<br /><br />$" + (req.body.amount / 100) + " sent to " + req.body.toName + " " + req.body.phone + ".<br /><br />Thank you!, LBGift.";

                        var transporter = nodemailer.createTransport({
                            service: 'Gmail',
                            auth: {
                                user: config.gmail.username,
                                pass: config.gmail.password
                            }
                        });
                        var mailOptions = {
                            from: config.gmail.alias,
                            to: req.body.email,
                            subject: 'Receipt for Your LBGift Order',
                            text: messagePlain,
                            html: messageHTML
                        }
                        console.log(mailOptions);
                        transporter.sendMail(mailOptions, function(error, response) {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log("Message sent: " + response.message);
                            }
                        });

                        var toName = req.body.toName;
                        var fromName = req.body.fromName;
                        var amount = req.body.amount;
                        var messages = [
                            ":cake: " + toName + ", " + fromName + " has sent you a $" + amount + " gift for your birthday! View it here: ",
                            ":ring: " + toName + ", " + fromName + " has sent you a $" + amount + " wedding gift card! View it here: ",
                            ":revolving_hearts: " + toName + ", " + fromName + " has sent you a $" + amount + " gift for your anniversary! View it here: ",
                            ":baby_bottle: " + toName + ", " + fromName + " has sent you a $" + amount + " gift for your baby! View it here:",
                            ":gift_heart: " + toName + ", " + fromName + " has sent you a $" + amount + " gift! View it here: ",
                            ":bouquet: " + toName + ", " + fromName + " has sent you a $" + amount + " gift to cheer you up. View it here: ",
                            ":ambulance: " + toName + ", " + fromName + " has sent you a $" + amount + " gift and a note. View it here: ",
                            ":blush: " + toName + ", " + fromName + " has sent you a $" + amount + " gift to say thank you! View it here: ",
                            ":trophy: " + toName + ", " + fromName + " has sent you a $" + amount + " gift to congratulate you! View it here: ",
                            ":gift: " + toName + ", " + fromName + " has sent you a $" + amount + " gift! View it here: ",
                        ];

                        if (sent) {
                            SessionService.generateSession(toId, "user", function(err, token) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    shortURLService.create(process.argv[2] + "/#/giftcards/" + giftcard._id + "?token=" + token, function(url) {
                                        client.messages.create({
                                            body: messages[req.body.iconId] + url,
                                            to: "+1" + req.body.phone,
                                            from: config.twilio.number
                                        }, function(err, message) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                console.log(message.sid);
                                            }
                                        });
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


    }
});

/* Get giftcards */
router.get('/', function(req, res) {
    //Check if required was sent
    if (!req.query.sessionToken) {
        return res.status(412).send("Requirements Unmet");
    }

    //Validate session
    SessionService.validateSession(req.query.sessionToken, "user", function(err, accountId) {
        if (err) {
            return res.status(err.status).send("Session Error");
        } else {
            Giftcard.find({
                    toId: accountId
                })
                .sort('-created')
                .lean()
                .select('_id toId fromId amount origAmount iconId message location created thanked')
                .populate('fromId', 'name')
                .populate('toId', 'name')
                .populate('location.subId', '_id name')
                .populate('location.locationId', '_id name address1 address2 city state zipcode subs')
                .exec(function(err, giftcards) {
                    if (err) {
                        return res.status(500).send("Error searching DB");
                    } else {
                        //Store the spent giftcards
                        var spent = [];
                        //Loop through giftcards
                        for (var i = 0; i < giftcards.length; i++) {
                            //Find any that are zero
                            if (giftcards[i].amount == 0) {
                                //Remove from giftcards and add to spent
                                spent.push(giftcards.splice(i, 1)[0]);
                                //If there are still giftcards left
                                if (giftcards.length > 0) {
                                    //Check to make sure that new giftcard at current position (from splice) is not zero
                                    //And also that it exists
                                    if (giftcards[i] && giftcards[i].amount == 0) {
                                        //If it is, check the current position again.
                                        i--;
                                    }
                                }
                            }
                        }
                        //Add all spent giftcards to end of giftcards array
                        for (var j = 0; j < spent.length; j++) {
                            giftcards.push(spent[j]);
                        }
                        res.status(200).json(giftcards);
                    }
                });
        }
    });
});

/* Get given giftcards */
router.get('/given', function(req, res) {
    //Check if required was sent
    if (!req.query.sessionToken) {
        return res.status(412).send("Requirements Unmet");
    }

    //Validate session
    SessionService.validateSession(req.query.sessionToken, "user", function(err, accountId) {
        if (err) {
            return res.status(err.status).send("Session Error");
        } else {
            Giftcard.find({
                    fromId: accountId
                })
                .sort('-created')
                .lean()
                .select('_id toId fromId origAmount iconId message location created')
                .populate('fromId', 'name')
                .populate('toId', 'name')
                .populate('location.subId', '_id name')
                .populate('location.locationId', '_id name address1 address2 city state zipcode subs')
                .exec(function(err, giftcards) {
                    if (err) {
                        return res.status(500).send("Error searching DB");
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
                .select('_id toId fromId amount origAmount iconId message location created thanked')
                //use populate to also returns the users name in the giftcards object!
                .populate('fromId', 'name') // populate the actual user and only return their name
                .populate('toId', 'name') //populate the actual user and only return their name
                .populate('location.subId', '_id name')
                .populate('location.locationId', '_id name address1 address2 city state zipcode subs')
                .exec(function(err, giftcard) {
                    if (err) {
                        res.status(500).json({
                            msg: "Couldn't search the database for giftcard!"
                        });
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

/* Save a giftcard for later (email return link) */
router.post('/later', function(req, res) {
    //Check if required was sent
    if (!(req.body.sessionToken &&
            req.body.giftcardId)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    SessionService.validateSession(req.body.sessionToken, "user", function(err, accountId) {
        if (err) {
            res.json(err);
        } else {
            User.findOne({
                    _id: accountId
                })
                .select('name email phone created updated')
                .exec(function(err, user) {
                    if (err) {
                        res.status(500).json({
                            msg: "Couldn't search the database for user!"
                        });
                    } else if (!user) {
                        res.status(404).json({
                            msg: "User does not exist!"
                        });
                    } else {
                        Giftcard.findOne({
                            toId: accountId,
                            _id: req.body.giftcardId
                        }).exec(function(err, giftcard) {
                            if (err) {
                                res.status(500).json({
                                    msg: "Couldn't search the database for giftcard!"
                                });
                            } else if (!giftcard) {
                                res.status(404).json({
                                    msg: "No giftard with that ID!"
                                });
                            } else {
                                shortURLService.create(process.argv[2] + "/#/giftcards/" + req.body.giftcardId + "?token=" + req.body.sessionToken, function(url) {
                                    var messagePlain = "Hello " + user.name + ", Here is a link for the giftcard you saved: " + url + " Thanks, The Localight Team";
                                    var messageHTML = "Hello " + user.name + ",<br /><br />Here is a link for the giftcard you saved:<br /><a href='" + url + "'>" + url + "</a><br /><br />Thanks!<br />The Localight Team";

                                    var transporter = nodemailer.createTransport({
                                        service: 'Gmail',
                                        auth: {
                                            user: config.gmail.username,
                                            pass: config.gmail.password
                                        }
                                    });
                                    var mailOptions = {
                                        from: config.gmail.alias,
                                        to: user.email,
                                        subject: 'Your Saved Giftcard Link for LBGift',
                                        text: messagePlain,
                                        html: messageHTML
                                    }
                                    console.log(mailOptions);
                                    transporter.sendMail(mailOptions, function(error, response) {
                                        if (error) {
                                            console.log(error);
                                        } else {
                                            console.log("Message sent!");
                                        }
                                    });

                                    res.status(200).json({
                                        msg: "Email was sent!"
                                    });
                                });
                            }
                        });
                    }
                });
        }
    });
});

module.exports = router;
