var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    SessionService = require('../services/sessions.js'),
    Location = mongoose.model('Location'),
    Transaction = mongoose.model('Transaction'),
    Giftcard = mongoose.model('Giftcard');

/* Create a Location */
router.post('/', function(req, res) {
    //Check if required was sent
    if (!(req.body.name &&
            req.body.triconKey &&
            req.body.address1 &&
            req.body.sessionToken)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }
    var giftCode;
    SessionService.validateSession(req.body.sessionToken, "owner", function(accountId) {
        createCode();

        function createCode() {
            giftCode = Math.floor(Math.random() * 90000) + 10000;

            //Check if an owner with that email already exists
            Location.findOne({
                    $or: [{
                        'ownerCode': giftCode
                    }, {
                        'subs.subCode': giftCode
                    }]
                })
                .select('_id')
                .exec(function(err, location) {
                    if (location) {
                        createCode();
                    } else {
                        createLocation();
                    }
                });
        }

        function createLocation() {
            new Location({
                name: req.body.name,
                triconKey: req.body.triconKey,
                address1: req.body.address1,
                address2: req.body.address2,
                city: req.body.city,
                state: req.body.state,
                zipcode: req.body.zipcode,
                ownerId: accountId,
                ownerCode: giftCode
            }).save(function(err, location) {
                if (err) {
                    console.log("Error saving location to DB!");
                    res.status(500).json({
                        msg: "Error saving location to DB!"
                    });
                } else {
                    res.status(201).send("Created");
                }
            });
        }
    }, function(err){
        res.status(err.status).json(err);
    });
});

/* Get all Locations */
router.get('/', function(req, res) {
    Location.find({})
        .select('_id name address1 address2 city state zipcode')
        .exec(function(err, locations) {
            if (err) {
                return res.status(500).json({
                    msg: "Couldn't query the database for locations!"
                });
            } else {
                res.status(200).json(locations);
            }
        });
});

/* Get a Location by code */
router.get('/code', function(req, res) {
    if (!(req.query.code)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    Location.findOne({
            'ownerCode': req.query.code
        })
        .select('_id name address1 address2 city state zipcode ownerId')
        .exec(function(err, location) {
            if (err) {
                return res.status(500).json({
                    msg: "Couldn't query the database for location owner!"
                });
            } else if (location) {
                res.status(200).json(location);
            } else {
                Location.findOne({
                        'subs.subCode': req.query.code
                    })
                    .select('_id name address1 address2 city state zipcode subs')
                    .lean()
                    .exec(function(err, location) {
                        if (err) {
                            return res.status(500).json({
                                msg: "Couldn't query the database for location sub!"
                            });
                        } else if (location) {
                            var subId = "";
                            for (var i = 0; i < location.subs.length; i++) {
                                if (location.subs[i].subCode == req.query.code) {
                                    subId = location.subs[i].subId;
                                }
                            }
                            location.subs = "";
                            location.subId = subId;
                            res.status(200).json(location);
                        } else {
                            res.status(404).json({
                                msg: "No location with that code"
                            })
                        }
                    });

            }
        });
});

/* Get a Location by id */
router.get('/:id', function(req, res) {
    Location.findOne({
            _id: req.params.id
        })
        .select('_id name address1 address2 city state zipcode')
        .exec(function(err, locations) {
            if (err) {
                return res.status(500).json({
                    msg: "Couldn't query the database for locations!"
                });
            } else {
                res.status(200).json(locations);
            }
        });
});

/* Get a Locations for an owner */
router.get('/owner/:id', function(req, res) {
    Location.find({
            $or: [{
                'ownerId': req.params.id
            }, {
                'subs.subId': req.params.id
            }]
        })
        .select('_id name triconKey address1 address2 city state zipcode ownerId ownerCode subs')
        .exec(function(err, locations) {
            if (err) {
                return res.status(500).json({
                    msg: "Couldn't query the database for locations!"
                });
            } else {
                res.status(200).json(locations);
            }
        });
});

/* Update a Location */
router.put('/:id', function(req, res) {
    //Check if required was sent
    if (!req.body.sessionToken) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }
    SessionService.validateSession(req.body.sessionToken, "owner", function(accountId) {
        var updatedLocation = {};

        if (req.body.name && typeof req.body.name === 'string') updatedLocation.name = req.body.name;
        if (req.body.triconKey && typeof req.body.triconKey === 'string') updatedLocation.triconKey = req.body.triconKey;
        if (req.body.address1 && typeof req.body.address1 === 'string') updatedLocation.address1 = req.body.address1;
        if (req.body.address2 && typeof req.body.address2 === 'string') updatedLocation.address2 = req.body.address2;
        if (req.body.city && typeof req.body.city === 'string') updatedLocation.city = req.body.city;
        if (req.body.state && typeof req.body.state === 'string') updatedLocation.state = req.body.state;
        if (req.body.zipcode && typeof req.body.zipcode === 'string') updatedLocation.zipcode = req.body.zipcode;

        var setLocation = {
            $set: updatedLocation
        }

        Location.update({
                _id: req.params.id,
                ownerId: accountId
            }, setLocation)
            .exec(function(err, location) {
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

/* Delete a Location */
router.delete('/:id', function(req, res) {
    //Check if required was sent
    if (!req.body.sessionToken) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }
    SessionService.validateSession(req.body.sessionToken, "owner", function(accountId) {
        Location.findOne({
                $or: [{
                    '_id': req.params.id,
                    'ownerId': accountId
                }, {
                    '_id': req.params.id,
                    'subs.subId': accountId
                }]
            })
            .remove(function(err, location) {
                if (err) {
                    return res.status(500).json({
                        msg: "Couldn't query the database for locations!"
                    });
                } else if (!location) {
                    res.status(409).json({
                        msg: "Could not find a location with that id!"
                    });
                } else {
                    res.status(200).json({
                        msg: "Deleted!"
                    });
                }
            });
    }, function(err){
        res.status(err.status).json(err);
    });
});

/* Make a purchase at a location */
router.post('/:id/spend', function(req, res, next) {
    //Check if required was sent
    if (!(req.body.amount &&
            req.body.triconKey &&
            req.body.sessionToken)) {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }

    SessionService.validateSession(req.body.sessionToken, "user", function(accountId) {
        Location.findOne({
                _id: req.params.id,
                triconKey: req.body.triconKey
            })
            .select('_id triconKey')
            .exec(function(err, location) {
                if (err) {
                    return res.status(500).json({
                        msg: "Couldn't search the database for location!"
                    });
                } else if (!location) {
                    return res.status(404).json({
                        msg: "Invalid ID or Tricon!"
                    });
                } else {
                    //Find all valid giftcards for the user
                    Giftcard.find({
                            toId: accountId,
                            amount: {
                                $gt: 0
                            },
                            sent: true
                        })
                        .select('_id amount')
                        .exec(function(err, giftcards) {
                            if (err) {
                                return res.status(500).json({
                                    msg: "Couldn't search the database for giftcard!"
                                });
                            } else {
                                //Total up the user's giftcards for balance
                                var total = 0;
                                for (var i = 0; i < giftcards.length; i++) {
                                    total += giftcards[i].amount;
                                }
                                //Check if desired chargeAmount is greater than total balance
                                var chargeAmt = req.body.amount;
                                if (chargeAmt > total) {
                                    res.status(402).json({
                                        msg: "Not enough funds."
                                    });
                                } else {
                                    new Transaction({
                                        userId: accountId,
                                        locationId: req.params.id,
                                        amount: chargeAmt
                                    }).save(function(err, transaction) {
                                        if (err) {
                                            console.log("Error saving charge to DB!");
                                            res.status(500).json({
                                                msg: "Error saving charge to DB!"
                                            });
                                        } else {
                                            //Run until chargeAmount is satisfied
                                            var i = 0;
                                            while (chargeAmt > 0) {
                                                //Store the deducted giftcard amount
                                                var newGcAmt;
                                                if (chargeAmt > giftcards[i].amount) {
                                                    //chargeAmount greater than giftcard, 0 the giftcard
                                                    newGcAmt = 0;
                                                } else {
                                                    //Deduct the chargeAmount from giftcard
                                                    newGcAmt = giftcards[i].amount - chargeAmt;
                                                }
                                                //Prepare the deducted card balance
                                                var updateGiftcard = {
                                                        $set: {
                                                            amount: newGcAmt
                                                        }
                                                    }
                                                    //Deduct from the card balance
                                                Giftcard.update({
                                                        _id: giftcards[i]._id
                                                    }, updateGiftcard)
                                                    .exec(function(err, location) {
                                                        if (err) {
                                                            //Prepare the error
                                                            var transactionError = {
                                                                $push: {
                                                                    errs: {
                                                                        err: err
                                                                    }
                                                                }
                                                            }
                                                            Transaction.update({
                                                                    _id: transaction.id
                                                                }, transactionError)
                                                                .exec(function(err, location) {
                                                                    if (err) {
                                                                        console.log("FATAL error logging giftcard deduction transaction error!")
                                                                    }
                                                                });
                                                        }
                                                    });
                                                //Subtract from the remaining amount to be charged
                                                chargeAmt = chargeAmt - giftcards[i].amount;
                                                i++;
                                            }
                                            res.status(200).json({
                                                msg: "Charge was completed!"
                                            });
                                        }
                                    });
                                }
                            }
                        });
                }
            });
    }, function(err){
        res.status(err.status).json(err);
    });
});

module.exports = router;
