var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    SessionService = require('../services/sessions.js'),
    Location = mongoose.model('Location'),
    Transaction = mongoose.model('Transaction'),
    Payout = mongoose.model('Payout'),
    Giftcard = mongoose.model('Giftcard');

/* Get Transactions */
router.get('/', function(req, res) {
    SessionService.validateSession(req.query.sessionToken, "admin", function(err, accountId) {
        if (err) {
            res.status(err.status).json(err);
        } else {
            //Adaptive query object
            var query = {};
            //Find the various query options and set them
            if (req.query.paidOut === "true") {
                query.paidOut = true;
            } else if (req.query.paidOut === "false") {
                query.paidOut = false;
            }

            if(req.query.created_after || req.query.created_before){
                query.created = {};
            }

            if (req.query.created_after) {
                query.created.$gte = req.query.created_after;
            }
            if (req.query.created_before) {
                query.created.$lt = req.query.created_before;
            }

            //Find all transactions matching the query
            Transaction.find(query)
                .select('_id userId locationId amount errs paidOut created')
                .populate('userId')
                .populate('locationId', '-triconKey')
                .exec(function(err, transactions) {
                    //PopOptions will populate the deep referenced owner object.
                    //Populate normally can only go 1 layer deep, however using .populate, deeper population is possible
                    var popOptions = {
                        path: 'locationId.ownerId',
                        model: 'Owner',
                        select: '-password -salt'
                    };

                    if (err) return res.status(500).json({
                        msg: "Transaction query failed",
                        dberr: err,
                        query: query
                    });
                    //Deep populate the ownerId field
                    Transaction.populate(transactions, popOptions, function(err, transactions) {
                        if (err) {
                            return res.status(500).json({
                                msg: "Couldn't query the database for locations!"
                            });
                        } else {
                            res.status(200).json(transactions);
                        }
                    });
                });
        }
    });

});

/* Create a payout */
router.post('/payouts', function(req, res) {
    if (req.body.transactions && req.body.method) {
        if (Object.prototype.toString.call(req.body.transactions) === '[object Array]') {
            SessionService.validateSession(req.body.sessionToken, "admin", function(err, accountId) {
                if (err) {
                    res.status(err.status).json(err);
                } else {
                    //Find all transactions provided to the server in transactions ID array
                    Transaction.find({
                            '_id': {
                                $in: req.body.transactions
                            }
                        })
                        .populate('transactions')
                        .lean()
                        .exec(function(err, transactions) {
                            if (err) return res.status(500).json({
                                msg: "Error querying transactions"
                            });

                            //Calculate the total expendature for Localight account and remove any transactions that have paidOut:true
                            var totalPayout = 0;
                            for (var i = 0; i < transactions.length; i++) {
                                //Check if transaction has already been paidOut
                                if(transactions[i].paidOut){
                                    //Remove paid element from payout
                                    transactions.splice(i, 1);
                                    //Revisit this element in loop due to splice()
                                    i--;
                                    //Check if there are still transactions left
                                    if(transactions.length == 0){
                                        //Break away from rest of route
                                        return res.status(404).json({
                                            msg: "No unpaid transactions specified!"
                                        });
                                    }
                                    continue;
                                }

                                totalPayout = totalPayout + transactions[i].amount;
                            }

                            //Calculate the individual payout for each location using a JavaScript hashmap
                            var locationPayout = {};
                            for (var i = 0; i < transactions.length; i++) {
                                //If hashmap key not found, initialize it
                                if(!locationPayout[transactions[i].locationId]){
                                    locationPayout[transactions[i].locationId] = 0;
                                }
                                //Add current transaction value to hashmap key of locationId
                                locationPayout[transactions[i].locationId] = locationPayout[transactions[i].locationId] + transactions[i].amount;
                            }

                            //Get transaction ids only
                            var transactionIds = [];
                            for (var i = 0; i < transactions.length; i++){
                                transactionIds.push(transactions[i]._id);
                            }

                            //Assemble locations array to be inserted with locationId and amount to each respective location
                            var locations = [];
                            //Get the keys from the hashmap
                            var locationPayoutKeys = Object.keys(locationPayout);
                            for (var i = 0; i < locationPayoutKeys.length; i++){
                                locations.push({
                                    location: locationPayoutKeys[i],
                                    amount: locationPayout[locationPayoutKeys[i]]
                                });
                            }

                            new Payout({
                                transactions: transactionIds,
                                amount: totalPayout,
                                method: req.body.method,
                                locations: locations
                            }).save(function(err, payout) {
                                if (err) {
                                    res.status(500).json({
                                        msg: "Error saving giftcard to database!"
                                    });
                                } else {
                                    res.status(201).json(payout);
                                }
                            });

                            //Update all recently paid transactions with payedOut:true
                            for (var i = 0; i < transactions.length; i++) {
                                Transaction.update({
                                        _id: transactions[i]._id
                                    }, {
                                        $set: {
                                            paidOut: true
                                        }
                                    })
                                    .exec(function(err, transaction) {
                                        if (err) {
                                            console.log("Error updating transaction paidOut:true")
                                        }
                                    });
                            }
                        });
                }
            });
        } else {
            return res.status(400).json({
                msg: "Transactions must be an array of objects"
            });
        }
    } else {
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }
});

/* Get Payouts */
router.get('/payouts', function(req, res) {
    SessionService.validateSession(req.query.sessionToken, "admin", function(err, accountId) {
        if (err) {
            res.status(err.status).json(err);
        } else {
            Payout.find({})
                .select()
                .sort('-created')
                .populate('transactions')
                .exec(function(err, payouts) {
                    var popOptions = {
                        path: 'transactions.locationId',
                        model: 'Location',
                        select: '-triconKey'
                    };

                    if (err) return res.json(500);
                    Transaction.populate(payouts, popOptions, function(err, payouts) {
                        if (err) {
                            return res.status(500).json({
                                msg: "Couldn't query the database for locations!"
                            });
                        } else {
                            var popOptions = {
                                path: 'locations.location',
                                model: 'Location',
                                select: '-triconKey'
                            };

                            if (err) return res.json(500);
                            Transaction.populate(payouts, popOptions, function(err, payouts) {
                                if (err) {
                                    return res.status(500).json({
                                        msg: "Couldn't query the database for locations!"
                                    });
                                } else {
                                    res.status(200).json(payouts);
                                }
                            });
                        }
                    });


                });
        }
    });
});

/* Get Payout */
router.get('/payouts/:id', function(req, res) {
    SessionService.validateSession(req.query.sessionToken, "admin", function(err, accountId) {
        if (err) {
            res.status(err.status).json(err);
        } else {
            Payout.findOne({
                    _id: req.params.id
                })
                .select()
                .sort('-created')
                .populate('transactions')
                .exec(function(err, payouts) {
                    //Get location subdoc
                    var popOptions = {
                        path: 'transactions.locationId',
                        model: 'Location',
                        select: '-triconKey'
                    };

                    if (err) return res.json(500);
                    Payout.populate(payouts, popOptions, function(err, payouts) {
                        if (err) {
                            return res.status(500).json({
                                msg: "Couldn't query the database for locations!"
                            });
                        } else {
                            //Get owner subdoc
                            var popOptions = {
                                path: 'transactions.locationId.ownerId',
                                model: 'Owner',
                                select: '-password -salt'
                            };

                            if (err) return res.json(500);
                            Payout.populate(payouts, popOptions, function(err, payouts) {
                                if (err) {
                                    return res.status(500).json({
                                        msg: "Couldn't query the database for locations!"
                                    });
                                } else {
                                    var popOptions = {
                                        path: 'transactions.userId',
                                        model: 'User',
                                        select: ''
                                    };

                                    if (err) return res.json(500);
                                    Payout.populate(payouts, popOptions, function(err, payouts) {
                                        if (err) {
                                            return res.status(500).json({
                                                msg: "Couldn't query the database for locations!"
                                            });
                                        } else {
                                            var popOptions = {
                                                path: 'locations.location',
                                                model: 'Location',
                                                select: '-triconKey'
                                            };

                                            if (err) return res.json(500);
                                            Transaction.populate(payouts, popOptions, function(err, payouts) {
                                                if (err) {
                                                    return res.status(500).json({
                                                        msg: "Couldn't query the database for locations!"
                                                    });
                                                } else {
                                                    res.status(200).json(payouts);
                                                }
                                            });
                                        }
                                    });

                                }
                            });

                        }
                    });


                });
        }
    });
});

/* Get Transaction by ID */
router.get('/:id', function(req, res) {
    SessionService.validateSession(req.query.sessionToken, "admin", function(err, accountId) {
        if (err) {
            res.status(err.status).json(err);
        } else {
            //Find transaction by id
            Transaction.findOne({
                _id: req.params.id
            })
                .select('_id userId locationId amount errs paidOut created')
                .populate('userId')
                .populate('locationId', '-triconKey')
                .exec(function(err, transaction) {
                    //PopOptions will populate the deep referenced owner object.
                    //Populate normally can only go 1 layer deep, however using .populate, deeper population is possible
                    var popOptions = {
                        path: 'locationId.ownerId',
                        model: 'Owner',
                        select: '-password -salt'
                    };

                    if (err) return res.status(500).json({
                        msg: "Transaction query failed",
                        dberr: err,
                        query: query
                    });
                    //Deep populate the ownerId field
                    Transaction.populate(transaction, popOptions, function(err, transaction) {
                        if (err) {
                            return res.status(500).json({
                                msg: "Couldn't query the database for locations!"
                            });
                        } else {
                            res.status(200).json(transaction);
                        }
                    });
                });
        }
    });
});

module.exports = router;
