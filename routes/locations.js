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
    SessionService.validateSession(req.body.sessionToken, "owner", function(err, accountId) {
        if (err) {
            res.json(err);
        } else {
            new Location({
                name: req.body.name,
                triconKey: req.body.triconKey,
                address1: req.body.address1,
                address2: req.body.address2,
                city: req.body.city,
                state: req.body.state,
                zipcode: req.body.zipcode,
                ownerId: accountId
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
            ownerId: req.params.id
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

/* Update a Location */
router.put('/:id', function(req, res) {
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
        }
    });
});

/* Delete a Location */
router.delete('/:id', function(req, res) {
    //Logic goes here
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

    SessionService.validateSession(req.body.sessionToken, "user", function(err, accountId) {
        if (err) {
            res.json(err);
        } else {
            Location.findOne({
                _id: req.params.id,
                triconKey: req.body.triconKey
            })
            .select('_id triconKey')
            .exec(function(err, location){
                if (err) {
                    return res.status(500).json({
                        msg: "Couldn't search the database for location!"
                    });
                } else if(!location) {
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
                                                                        errs: {err: err}
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
        }
    });
});

module.exports = router;
