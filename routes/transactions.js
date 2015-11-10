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
    var query = {};
    if(req.query.paid === "true"){
        query.paid = true;
    } else if(req.query.paid === "false") {
        query.paid = false;
    }

    if(req.query.created_after){
        query.created.$gte = req.query.created_after;
    }
    if(req.query.created_before){
        query.created.$lt = req.query.created_before;
    }

    Transaction.find(query)
        .select('_id userId locationId amount errs paidOut created')
        .populate('userId')
        .populate('locationId', '-triconKey')
        .exec(function(err, transactions) {
            var popOptions = {
              path: 'locationId.ownerId',
              model: 'Owner',
              select: '-password -salt'
            };

            if (err) return res.json(500);
            Transaction.populate(transactions, popOptions, function (err, transactions) {
                if (err) {
                    return res.status(500).json({
                        msg: "Couldn't query the database for locations!"
                    });
                } else {
                    res.status(200).json(transactions);
                }
            });


        });
});

/* Mark Transactions */
router.post('/payouts', function(req, res) {
    if(req.body.transactions && req.body.method){
        if(Object.prototype.toString.call( someVar ) === '[object Array]'){
            Transaction.update({
                    '_id': { $in: req.body.transactions }
                }, { $set: { paidOut: true } })
                .exec(function(err, transactions) {
                    if (err) return res.status(500).json({
                        msg: "Error querying transactions"
                    });
                    var totalPayout = 0;
                    for(var i=0; i<transactions.length;i++){
                        totalPayout = totalPayout + transactions[i].amount;
                    }
                    new Payout({
                        transactions: req.body.transactions,
                        amount: totalPayout,
                        method: req.body.method
                    }).save(function(err, payout) {
                        if (err) {
                            res.status(500).json({
                                msg: "Error saving giftcard to database!"
                            });
                        } else {
                            res.status(201).json(payout);
                        }
                    });
                });
        } else {
            return res.status(400).json({
                msg: "Transactions must be an array of objects"
            });
        }
        return res.status(412).json({
            msg: "You must provide all required fields!"
        });
    }
});

/* Get Payouts */
router.get('/payouts', function(req, res) {
    Payout.find({})
        .select()
        .sort('-created')
        .populate('transactions')
        .exec(function(err, payouts) {
            var popOptions = {
              path: 'transactions.locationId.ownerId',
              model: 'Owner',
              select: '-password -salt'
            };

            if (err) return res.json(500);
            Transaction.populate(payouts, popOptions, function (err, payouts) {
                if (err) {
                    return res.status(500).json({
                        msg: "Couldn't query the database for locations!"
                    });
                } else {
                    res.status(200).json(payouts);
                }
            });


        });
});

module.exports = router;
