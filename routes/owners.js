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
        return res.json({
            msg: "You must provide all required fields!",
            status: 412
        });
    }

    //Check if an owner with that email already exists
    Owner.findOne({
            email: req.body.email
        })
        .select('_id')
        .exec(function(err, owner) {
            if (owner) {
                res.json({
                    msg: "Email already exists!",
                    status: 409
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
                        res.json({
                            msg: "Error saving owner to DB!",
                            status: 500
                        });
                    } else {
                        SessionService.generateSession(owner._id, "owner", function(err, token) {
                            if (err) {
                                res.json(err);
                            } else {
                                //All good, give the owner their token
                                res.json({
                                    token: token,
                                    status: 201
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
        return res.json({
            msg: "You must provide all required fields!",
            status: 412
        });
    }
    //Find an owner with the email requested. Select salt and password
    Owner.findOne({
            email: req.body.email
        })
        .select('password salt _id')
        .exec(function(err, owner) {
            if (err) {
                res.json({
                    msg: "Couldn't search the database for owner!",
                    status: 500
                });
            } else if (!owner) {
                res.json({
                    msg: "Email does not exist!",
                    status: 401
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
                            res.json({
                                token: token,
                                status: 200
                            });
                        }
                    });
                } else {
                    res.json({
                        msg: "Password is incorrect!",
                        status: 401
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
