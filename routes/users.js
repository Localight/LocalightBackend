var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    config = require('../config/keys.json'),
    SessionService = require('../services/sessions.js'),
    nodemailer = require('nodemailer'),
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
                    SessionService.generateSession(user._id, "user", function(err, token) {
                        if (err) {
                            res.json(err);
                        } else {
                            //All good, give the user their token
                            res.status(200).json({
                                token: token
                            });
                        }
                    });
                } else {
                    res.status(401).json({
                        msg: "Password is incorrect!"
                    });
                }
            }
        });
});

/* User Join Through Twilio */
router.post('/twilio', function(req, res) {
    //Check if required was sent
    if (!(req.body.Body &&
            req.body.From)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    //Trim phone number
    var phone = req.body.From.substring(2);
    if (req.body.Body == "Gift") {
        //Check if a user with that username already exists
        User.findOne({
                phone: phone
            })
            .select('_id')
            .exec(function(err, user) {
                if (user) {
                    SessionService.generateSession(user._id, "user", function(err, token) {
                        if (err) {
                            res.json(err);
                        } else {
                            //All good, give the user their token
                            res.send('<Response><Message>' + process.argv[2] + '/#/giftcards/create?token=' + token + '</Message></Response>');
                        }
                    });
                } else {
                    //Create a new user with the assembled information
                    var user = new User({
                        phone: phone
                    }).save(function(err, user) {
                        if (err) {
                            console.log("Error saving user to DB!");
                            res.json({
                                msg: "Error saving user to DB!",
                                errorid: "666"
                            });
                        } else {
                            SessionService.generateSession(user._id, "user", function(err, token) {
                                if (err) {
                                    res.json(err);
                                } else {
                                    //All good, give the user their token
                                    res.send('<Response><Message>' + process.argv[2] + '/#/giftcards/create?token=' + token + '</Message></Response>');
                                }
                            });
                        }
                    });
                }
            });
    }
});

/* Update a user */
router.put('/', function(req, res, next) {
    //Check if required was sent
    if (!req.body.sessionToken) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    SessionService.validateSession(req.body.sessionToken, "user", function(err, accountId) {
        if (err) {
            res.json(err);
        } else {
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
        }
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

    SessionService.validateSession(req.query.sessionToken, "user", function(err, accountId) {
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
                        res.status(200).json(user);
                    }
                });
        }
    });
});

/* Delete a user */
router.delete('/:id', function(req, res) {
    //Logic goes here
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
                    User.findOne({
                            _id: req.body.fromId
                        })
                        .select('name email')
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
                                var messagePlain = req.body.message;
                                var messageHTML = req.body.message;

                                var transporter = nodemailer.createTransport({
                                    service: 'Gmail',
                                    auth: {
                                        user: config.gmail.username,
                                        pass: config.gmail.password
                                    }
                                });
                                var mailOptions = {
                                    from: config.gmail.alias,
                                    to: recipient.email,
                                    subject: 'A Thank You From ' + user.name,
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

                                res.status(200).json({
                                    msg: "Email was sent!"
                                });

                                var setGC = {
                                    $set: { thanked: true }
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

        }
    });
});

module.exports = router;
