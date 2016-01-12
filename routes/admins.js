var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    config = require('../config/keys.json'),
    SessionService = require('../services/sessions.js'),
    Admin = mongoose.model('Admin');

/* Admin Join */
router.post('/join', function(req, res) {
    //Check if required was sent
    if (!(req.body.email &&
            req.body.password &&
            req.body.name &&
            req.body.sk)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    var sk = config.admin.sk;
    if (req.body.sk != sk) {
        res.status(401).json({
            msg: "SK is incorrect!"
        });
    } else {
        //Check if an admin with that email already exists
        Admin.findOne({
                email: req.body.email
            })
            .select('_id')
            .exec(function(err, admin) {
                if (admin) {
                    res.status(409).json({
                        msg: "Email already exists!"
                    });
                } else {
                    //Create a random salt
                    var salt = crypto.randomBytes(128).toString('base64');
                    //Create a unique hash from the provided password and salt
                    var hash = crypto.pbkdf2Sync(req.body.password, salt, 10000, 512);
                    //Create a new admin with the assembled information
                    new Admin({
                        name: req.body.name,
                        email: req.body.email,
                        password: hash,
                        salt: salt
                    }).save(function(err, admin) {
                        if (err) {
                            console.log("Error saving admin to DB!");
                            res.status(500).json({
                                msg: "Error saving admin to DB!"
                            });
                        } else {
                            SessionService.generateSession(admin._id, "admin", function(token) {
                                //All good, give the admin their token
                                res.status(201).json({
                                    token: token
                                });
                            }, function(err){
                                res.status(err.status).json(err);
                            });
                        }
                    });
                }
            });
    }
});

/* Admin Login */
router.post('/login', function(req, res) {
    //Check if required was sent
    if (!(req.body.email &&
            req.body.password)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }
    //Find an admin with the email requested. Select salt and password
    Admin.findOne({
            email: req.body.email
        })
        .select('password salt _id')
        .exec(function(err, admin) {
            if (err) {
                res.status(500).json({
                    msg: "Couldn't search the database for admin!"
                });
            } else if (!admin) {
                res.status(401).json({
                    msg: "Email does not exist!"
                });
            } else {
                //Hash the requested password and salt
                var hash = crypto.pbkdf2Sync(req.body.password, admin.salt, 10000, 512);
                //Compare to stored hash
                if (hash == admin.password) {
                    SessionService.generateSession(admin._id, "admin", function(token) {
                        //All good, give the admin their token
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

router.post('/promocodes', function(req, res){
    //Check if required was sent
    if (!(req.body.sessionToken &&
            req.body.amount &&
            req.body.keyword &&
            req.body.message &&
            req.body.sms &&
            req.body.fromName &&
            req.body.fromPhone &&
            req.body.locationCode)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    SessionService.validateSession(req.body.sessionToken, "admin", function(accountId) {
        //Find transaction by id
        PromoCode.findOne({
            keyword: req.body.keyword
        })
        .exec(function(err, promocode) {
            if(promocode){
                res.status(409).send("Conflict");
            } else {
                new PromoCode({
                    amount: req.body.amount,
                    keyword: req.body.keyword,
                    message: req.body.message,
                    sms: req.body.sms,
                    from: { name: req.body.fromName, phone: req.body.fromPhone },
                    locationCode: req.body.locationCode
                }).save(function(err, promoCode) {
                    if (err) {
                        res.status(500).json({
                            msg: "Error saving promoCode!"
                        });
                    } else {
                        res.status(201).send("Created");
                    }
                });
            }
        });
    }, function(err){
        res.status(err.status).json(err);
    });
});

router.get('/promocodes', function(req, res){
    //Check if required was sent
    if (!(req.query.sessionToken)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    SessionService.validateSession(req.body.sessionToken, "admin", function(accountId) {
        //Find transaction by id
        PromoCode.find()
        .exec(function(err, promocodes) {
            if(err){
                res.status(500).json({
                    msg: "Problem querying promocodes"
                });
            } else if(!promocode){
                res.status(404).json({
                    msg: "No promocodes found!"
                });
            } else {
                res.status(200).json(promocodes);
            }
        });
    }, function(err){
        res.status(err.status).json(err);
    });
});

router.get('/promocodes/:keyword', function(req, res){
    //Check if required was sent
    if (!(req.query.sessionToken)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    SessionService.validateSession(req.body.sessionToken, "admin", function(accountId) {
        //Find transaction by id
        PromoCode.findOne({
            keyword: req.params.keyword
        })
        .exec(function(err, promocode) {
            if(err){
                res.status(500).json({
                    msg: "Problem querying promocodes"
                });
            } else if(!promocode){
                res.status(404).send({
                    msg: "Promocode with that keyword not found"
                });
            } else {
                res.status(200).json(promocode);
            }
        });
    }, function(err){
        res.status(err.status).json(err);
    });
});

module.exports = router;
