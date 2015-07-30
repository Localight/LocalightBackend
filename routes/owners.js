var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    Owner = mongoose.model('Owner');

/* Owner Join */
router.post('/join', function(req, res, next) {
    //Check if required was sent
    if (!(req.body.email &&
            req.body.password &&
            req.body.name &&
            req.body.StripeCustomerId)) {
        return res.json({
            msg: "You must provide all required fields!",
            errorid: "994"
        });
    }

    //Check if an owner with that email already exists
    User.findOne({
            email: req.body.email
        })
        .select('_id')
        .exec(function(err, user) {
            if (user) {
                res.json({
                    msg: "Email already exists!",
                    errorid: "22"
                });
            } else {
                //Create a random salt
                var salt = crypto.randomBytes(128).toString('base64');
                //Create a unique hash from the provided password and salt
                var hash = crypto.pbkdf2Sync(req.body.password, salt, 10000, 512);
                //Create a new owner with the assembled information
                new Owner({
                    name: req.body.name,
                    StripeCustomerId: req.body.StripeCustomerId,
                    email: req.body.email,
                    password: hash,
                    salt: salt,
                    updated: Date.now()
                }).save(function(err, owner) {
                    if (err) {
                        console.log("Error saving owner to DB!");
                        res.json({
                            msg: "Error saving owner to DB!",
                            errorid: "666"
                        });
                    } else {
                        SessionService.generateSession(owner._id, "owner", function(err, token) {
                            if (err) {
                                res.json(err);
                            } else {
                                //All good, give the owner their token
                                res.json({
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
        return res.json({
            msg: "You must provide all required fields!",
            errorid: "994"
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
                    errorid: "777"
                });
            } else if (!owner) {
                res.json({
                    msg: "Email does not exist!",
                    errorid: "23"
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
                                token: token
                            });
                        }
                    });
                } else {
                    res.json({
                        msg: "Password is incorrect!",
                        errorid: "32"
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
