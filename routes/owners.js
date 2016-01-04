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
            req.body.name)) {
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
                    company: req.body.company,
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
                        SessionService.generateSession(owner._id, "owner", function(token){
                            //All good, give the owner their token
                            res.status(201).json({
                                token: token,
                                verified: owner.verified
                            });
                        }, function(err){
                            res.status(err.status).json(err);
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
        .select('password salt _id verified dob')
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
                    SessionService.generateSession(owner._id, "owner", function(token){
                        //All good, give the owner their token
                        res.status(200).json({
                            token: token,
                            verified: owner.verified,
                            dob: owner.dob
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

/* Reset Password */
router.post('/reset', function(req, res) {
    //Future implementation
});

/* Get an Owner */
router.get('/', function(req, res) {
    //Check if required was sent
    if (!(req.query.sessionToken)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    SessionService.validateSession(req.query.sessionToken, "owner", function(accountId) {
        Owner.findOne({
                _id: accountId
            })
            .select('_id name email code stripeCustomerId created updated verified dob')
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
    }, function(err){
        res.status(err.status).json(err);
    });

});

/* Get Owners, ADMIN ONLY */
router.get('/', function(req, res) {
    //Check if required was sent
    if (!(req.query.sessionToken)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    SessionService.validateSession(req.query.sessionToken, "admin", function(accountId) {
        var query = {}
        if(req.query.unverified)
            query = {
                verified: false
            }
        Owner.find(query)
            .select('_id name email code stripeCustomerId created updated verified dob')
            .exec(function(err, owners) {
                if (err) {
                    res.status(500).json({
                        msg: "Couldn't search the database for owners!"
                    });
                } else if (!owners) {
                    res.status(404).json({
                        msg: "No owners found!"
                    });
                } else {
                    res.status(200).json(owners);
                }
            });
    }, function(err){
        res.status(err.status).json(err);
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
    SessionService.validateSession(req.body.sessionToken, ["owner", "admin"], function(accountId, session){
        var updatedOwner = {};

        if (req.body.name && typeof req.body.name === 'string') updatedOwner.name = req.body.name;
        if (req.body.email && typeof req.body.email === 'string') updatedOwner.email = req.body.email;
        if (req.body.verified && typeof req.body.verified === 'string' && session.type == "admin") updatedOwner.verified = req.body.verified;
        updatedOwner.updated = Date.now();


        var setOwner = {
            $set: updatedOwner
        }

        var query = {
            null: "findNone"
        };
        if(session.type == "owner"){
            query = {
                _id: accountId
            }
        } else if(session.type == "admin" && req.body.accountId){
            query = {
                _id: req.body.accountId
            }
        }
        Owner.update(query, setOwner)
            .exec(function(err, owner) {
                if (err) {
                    res.status(500).json(err);
                } else {
                    res.status(200).send("OK");
                }
            })
    }, function(err){
        res.status(err.status).json(err);
    });
});

/* Remove an Owner */
router.delete('/', function(req, res) {
    //Disabled functionality, see Github Revision History.
});

module.exports = router;
