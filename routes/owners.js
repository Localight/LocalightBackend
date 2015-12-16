var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    SessionService = require('../services/sessions.js'),
    Location = mongoose.model('Location'),
    Owner = mongoose.model('Owner');

/* Owner Join */
router.post('/join', function(req, res) {
    //Check if required was sent
    if (!(req.body.email &&
            req.body.password &&
            req.body.name &&
            req.body.stripeCustomerId)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    //Check if an owner with that email already exists
    Owner.findOne({
            email: req.body.email
        })
        .select('_id')
        .exec(function(err, owner) {
            if (owner) {
                res.status(409).json({
                    msg: "Email already exists!"
                });
            } else {
                //Create a random salt
                var salt = crypto.randomBytes(128).toString('base64');
                //Create a unique hash from the provided password and salt
                var hash = crypto.pbkdf2Sync(req.body.password, salt, 10000, 512);
                //Create a new owner with the assembled information
                new Owner({
                    name: req.body.name,
                    stripeCustomerId: req.body.stripeCustomerId,
                    email: req.body.email,
                    password: hash,
                    salt: salt,
                    updated: Date.now()
                }).save(function(err, owner) {
                    if (err) {
                        console.log("Error saving owner to DB!");
                        res.status(500).json({
                            msg: "Error saving owner to DB!"
                        });
                    } else {
                        SessionService.generateSession(owner._id, "owner", function(err, token) {
                            if (err) {
                                res.json(err);
                            } else {
                                //All good, give the owner their token
                                res.status(201).json({
                                    token: token
                                });
                            }
                        });
                    }
                });
            }
        });

});

/* Owner Login */
router.post('/login', function(req, res) {
    //Check if required was sent
    if (!(req.body.email &&
            req.body.password)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }
    //Find an owner with the email requested. Select salt and password
    Owner.findOne({
            email: req.body.email
        })
        .select('password salt _id')
        .exec(function(err, owner) {
            if (err) {
                res.status(500).json({
                    msg: "Couldn't search the database for owner!"
                });
            } else if (!owner) {
                res.status(401).json({
                    msg: "Email does not exist!"
                });
            } else {
                //Hash the requested password and salt
                var hash = crypto.pbkdf2Sync(req.body.password, owner.salt, 10000, 512);
                //Compare to stored hash
                if (hash == owner.password) {
                    SessionService.generateSession(owner._id, "owner", function(err, token, verified) {
                        if (err) {
                            res.json(err);
                        } else {
                            //All good, give the owner their token
                            res.status(200).json({
                                token: token,
                                verified: verified
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

/* Reset Password */
router.post('/reset', function(req, res) {
    //Logic goes here
});

/* Get an Owner */
router.get('/', function(req, res) {
    //Check if required was sent
    if (!(req.query.sessionToken)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    SessionService.validateSession(req.query.sessionToken, "owner", function(err, accountId) {
        if (err) {
            res.json(err);
        } else {
            Owner.findOne({
                    _id: accountId
                })
                .select('_id name email code stripeCustomerId created updated verified')
                .exec(function(err, owner) {
                    if (err) {
                        res.status(500).json({
                            msg: "Couldn't search the database for owner!"
                        });
                    } else if (!owner) {
                        res.status(404).json({
                            msg: "Owner does not exist!"
                        });
                    } else {
                        res.status(200).json(owner);
                    }
                });
        }
    });

});

/* Update an Owner */
router.put('/', function(req, res) {
    //Check if required was sent
    if (!req.body.sessionToken) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }
    SessionService.validateSession(req.body.sessionToken, "owner", function(err, accountId) {
        if (err) {
            res.json(err);
        } else {
            var updatedOwner = {};

            if (req.body.name && typeof req.body.name === 'string') updatedOwner.name = req.body.name;
            if (req.body.email && typeof req.body.email === 'string') updatedOwner.email = req.body.email;
            updatedOwner.updated = Date.now();


            var setOwner = {
                $set: updatedOwner
            }

            Owner.update({
                    _id: accountId
                }, setOwner)
                .exec(function(err, owner) {
                    if (err) {
                        res.status(500).json(err);
                    } else {
                        res.status(200).send("OK");
                    }
                })
        }
    });
});

/* Remove an Owner */
router.delete('/', function(req, res) {
    //Check if required was sent
    if (!(req.body.sessionToken)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    SessionService.validateSession(req.body.sessionToken, "owner", function(err, accountId) {
        if (err) {
            res.json(err);
        } else {
            Location.find({
                    $or: [{
                        'ownerId': accountId
                    }, {
                        'subs.subId': accountId
                    }]
                })
                .select('_id')
                .exec(function(err, locations) {
                    if (err) {
                        return res.status(500).json({
                            msg: "Couldn't query the database for locations!"
                        });
                    } else if(locations){
                        res.status(409).json({
                            msg: "You still have locations in your account!"
                        });
                    } else {
                        Owner.findOne({
                                _id: accountId
                            }).remove(function(err, owner) {
                                if (err) {
                                    return res.status(500).json({
                                        msg: "Couldn't query the database for locations!"
                                    });
                                } else if (!owner) {
                                    res.status(409).json({
                                        msg: "Could not find an owner with that id!"
                                    });
                                } else {
                                    res.status(200).json({
                                        msg: "Deleted!"
                                    });
                                }
                            });
                    }
            });
        }
    });
});

module.exports = router;
