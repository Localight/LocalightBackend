var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    SessionService = require('../services/sessions.js'),
    Location = mongoose.model('Location'),
    Transaction = mongoose.model('Transaction'),
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
        .select('_id userId locationId amount errs')
        .exec(function(err, transactions) {
            if (err) {
                return res.status(500).json({
                    msg: "Couldn't query the database for locations!"
                });
            } else {
                res.status(200).json(transactions);
            }
        });
});

module.exports = router;
