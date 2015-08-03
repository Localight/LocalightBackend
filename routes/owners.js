var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    SessionService = require('../services/sessions.js'),
    Owner = mongoose.model('Owner');

/* Owner Join */
router.post('/join', function(req, res, next) {
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
router.post('/login', function(req, res, next) {
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
                    SessionService.generateSession(owner._id, "owner", function(err, token) {
                        if (err) {
                            res.json(err);
                        } else {
                            //All good, give the owner their token
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

/* Reset Password */
router.post('/reset', function(req, res, next) {
    //Logic goes here
});

/* Get an Owner */
router.get('/:id', function(req, res, next) {
    //Logic goes here
});

/* Update an Owner */
router.put('/:id', function(req, res, next) {
    //Logic goes here
});

/* Remove an Owner */
router.delete('/:id', function(req, res, next) {
    //Logic goes here
});

module.exports = router;
