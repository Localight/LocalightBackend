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
    Location = mongoose.model('Location'),
    User = mongoose.model('User');

/* User Login */
router.post('/login', function(req, res) {
    //Check if required was sent
    if (!(req.body.password &&
            req.body.phone)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    //Find a user with the username requested. Select salt and password
    User.findOne({
            phone: req.body.phone
        })
        .select('password salt _id')
        .exec(function(err, user) {
            if (err) {
                res.status(500).json({
                    msg: "Couldn't search the database for user!"
                });
            } else if (!user) {
                res.status(401).json({
                    msg: "Username does not exist!"
                });
            } else {
                //Hash the requested password and salt
                var hash = crypto.pbkdf2Sync(req.body.password, user.salt, 10000, 512);
                //Compare to stored hash
                if (hash == user.password) {
                    SessionService.generateSession(user._id, "user", function(token) {
                        //All good, give the user their token
                        res.status(200).json({
                            token: token
                        });
                    }, function(err){
                        res.status(err.status).json(err);
                    });
                } else {
                    res.status(401).json({
                        msg: "Password is incorrect!"
                    });
                }
            }
        });
});

/* Update a user */
router.put('/', function(req, res, next) {
    //Check if required was sent
    if (!req.body.sessionToken) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    SessionService.validateSession(req.body.sessionToken, "user", function(accountId) {
        var updatedUser = {};

        if (req.body.name && typeof req.body.name === 'string') updatedUser.name = req.body.name;
        if (req.body.email && typeof req.body.email === 'string') updatedUser.email = req.body.email;
        if (req.body.password && typeof req.body.password === 'string') {
            //Create a random salt
            var salt = crypto.randomBytes(128).toString('base64');
            //Create a unique hash from the provided password and salt
            var hash = crypto.pbkdf2Sync(req.body.password, salt, 10000, 512);
            updatedUser.password = hash;
            updatedUser.salt = salt;
        }
        updatedUser.updated = Date.now();

        var setUser = {
            $set: updatedUser
        }

        User.update({
                _id: accountId
            }, setUser)
            .exec(function(err, user) {
                if (err) {
                    res.status(500).json({
                        msg: "Could not update user"
                    });
                } else {
                    res.status(200).json(user);
                }
            })
    }, function(err){
        res.status(err.status).json(err);
    });
});

/* Get a user */
router.get('/', function(req, res) {
    //Check if required was sent
    if (!req.query.sessionToken) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    SessionService.validateSession(req.query.sessionToken, "user", function(accountId) {
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
                    res.status(200).json(user);
                }
            });
    }, function(err){
        res.status(err.status).json(err);
    });
});

/* Delete a user */
router.delete('/:id', function(req, res) {
    //Future implementation
});

/* Send thank you */
router.post('/thanks', function(req, res) {
    //Check if required was sent
    if (!(req.body.sessionToken &&
            req.body.fromId &&
            req.body.message)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    SessionService.validateSession(req.body.sessionToken, "user", function(accountId) {
        User.findOne({
                _id: accountId
            })
            .select('_id name email phone created updated')
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
                    User.findOne({
                            _id: req.body.fromId
                        })
                        .select('_id name email phone')
                        .exec(function(err, recipient) {
                            if (err) {
                                res.status(500).json({
                                    msg: "Couldn't search the database for recipient!"
                                });
                            } else if (!recipient) {
                                res.status(404).json({
                                    msg: "Recipient does not exist!"
                                });
                            } else {
                                if(recipient.phone == "0000000000"){

                                    var messagePlain = req.body.message + " Giftcard recipient phone number: " + user.phone + " and userId: " + user._id;
                                    var messageHTML = req.body.message + " Giftcard recipient phone number: " + user.phone + " and userId: " + user._id;

                                    var mail = mailcomposer({
                                        from: config.mailgun.alias,
                                        to: recipient.email,
                                        subject: 'Suggestions from promotional giftcard user: ' + user.name,
                                        body: messagePlain,
                                        html: messageHTML
                                    });

                                    mail.build(function(mailBuildError, message) {

                                        var dataToSend = {
                                            to: recipient.email,
                                            message: message.toString('ascii')
                                        };

                                        mailgun.messages().sendMime(dataToSend, function (sendError, body) {
                                            if (sendError) {
                                                console.log(sendError);
                                                return;
                                            }
                                        });
                                    });
                                } else {
                                    SessionService.generateSession(accountId, "user", function(token) {
                                        shortURLService.create(process.argv[2] + "/#/giftcards/create?token=" + token, function(url) {
                                            //Send actual thankyou
                                            client.messages.create({
                                                body: "A message from " + user.name + ": " + req.body.message,
                                                to: "+1" + recipient.phone,
                                                from: config.twilio.number
                                            }, function(err, message) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    console.log(message.sid);
                                                }
                                                //Send suggestion to send a giftcard back!
                                                client.messages.create({
                                                    body: "Do you want to send another giftcard? If so, just tap here " + url,
                                                    to: "+1" + user.phone,
                                                    from: config.twilio.number
                                                }, function(err, message) {
                                                    if (err) {
                                                        console.log(err);
                                                    } else {
                                                        console.log(message.sid);
                                                    }
                                                });
                                            });
                                        });
                                    }, function(err){
                                        console.log("Session generator error, thank-you-sms-send: ");
                                        console.log(err);
                                    });
                                }

                                res.status(200).json({
                                    msg: "Email was sent!"
                                });

                                var setGC = {
                                    $set: {
                                        thanked: true
                                    }
                                }

                                Giftcard.update({
                                        toId: accountId,
                                        fromId: req.body.fromId,
                                        thanked: false
                                    }, setGC)
                                    .exec(function(err, user) {
                                        if (err) {
                                            console.log({
                                                msg: "Could not update GC as thanked"
                                            });
                                        }
                                    })
                            }
                        });
                }
            });
    }, function(err){
        res.status(err.status).json(err);
    });
});

module.exports = router;
