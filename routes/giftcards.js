var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    config = require('../config/keys.json'),
    stripe = require("stripe")(config.stripe.accountKey),
    client = require('twilio')(config.twilio.accountSid, config.twilio.authToken),
    Giftcard = mongoose.model('Giftcard'),
    SessionService = require('../services/sessions.js'),
    User = mongoose.model('User');

//Allow Cross Origin Support
router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/* Create a giftcard */
router.post('/', function(req, res, next) {
    //Validate session
    SessionService.validateSession(req.body.sessionToken, "user", function(err, accountId){
        if(err){
            res.json(err);
        } else {
            //Find a user with the id requested. Get phone number.
            var toPhone;
            User.findById(req.body.toId)
            .select('phone')
            .exec(function(err, user) {
                if(err){
                  return res.json({msg: "Couldn't search the database for user!",
                          errorid: "774", rawerr: err});
                } else if(!user){
                  return res.json({msg: "No user exists under that id!",
                          errorid: "13234"});
                } else {
                    toPhone = user.phone;

                    if(!accountId ||
                    !req.body.toId ||
                    !req.body.amount || !(req.body.amount > 0) || !(req.body.amount < 50000) ||
                    !req.body.iconId ||
                    !req.body.message){
                        return res.json({msg: "You must provide toId, 0<amount<50000, iconId and message."});
                    }

                    // Get the credit card details submitted by the form
                    var stripeCardToken = req.body.stripeCardToken;

                    var stripeError;
                    var charge = stripe.charges.create({
                    amount: req.body.amount, // amount in cents, again
                    currency: "usd",
                    source: stripeCardToken,
                    description: req.body.message
                    }, function(err, charge) {
                        if (err && err.type === 'StripeCardError') {
                            stripeError = {msg: "Card was declined!",
                                    errorid: "12122"};
                        }
                    });

                    if(stripeError){
                        return res.json(stripeError);
                    }

                    new Giftcard({
                        fromId: accountId,
                        toId: req.body.toId,
                        amount: req.body.amount,
                        iconId: req.body.iconId,
                        message: req.body.message,
                        created: Date.now(),
                        stripeOrderId: charge.id
                    }).save(function(err){
                        if(err){
                            res.json({msg: "Error saving giftcard to database!",
                                    errorid: "667", rawerr: err});
                        } else {
                            //All good, give basic response
                            res.json({msg: "Success!"});

                            //Email receipt

                            client.messages.create({
                                body: "You have a new giftcard on lbgift! http://lbgift.com/giftcards/",
                                to: "+1" + toPhone,
                                from: "+15623208034"
                            }, function(err, message) {
                                if(err){
                                    console.log(err);
                                } else {
                                    process.stdout.write(message.sid);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

/* Get giftcards */
router.get('/', function(req, res, next) {
    //Validate session
    SessionService.validateSession(req.query.sessionToken, "user", function(err, accountId){
        if(err){
            res.json(err);
        } else {
            Giftcard.find({
                toId: accountId
            })
            .select('_id fromId amount iconId message')
            .exec(function(err, giftcards) {
                if(err){
                    return res.json({msg: "Couldn't search the database for session!",
                            errorid: "779"});
                } else {
                    res.json(giftcards);
                }
            });
        }
    });
});

/* Get a giftcard */
router.get('/:id', function(req, res, next) {
    SessionService.validateSession(req.query.sessionToken, "user", function(err, accountId){
        if(err){
            res.json(err);
        } else {
            Giftcard.findOne({
                toId: accountId,
                _id: req.params.id
            })
            .select('_id fromId amount iconId message')
            .exec(function(err, giftcard) {
                if(err){
                    res.json(err);
                } else if(!giftcard){
                    res.json({msg: "No giftard with that ID!",
                        errorid: "39"});
                } else {
                    res.json(giftcard);
                }
            });
        }
    });
});

/* Update a giftcard */
router.put('/:id', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
