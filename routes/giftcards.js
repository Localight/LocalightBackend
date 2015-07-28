var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    config = require('../config/keys.json'),
    stripe = require("stripe")(config.stripe.accountKey),
    client = require('twilio')(config.twilio.accountSid, config.twilio.authToken),
    Giftcard = mongoose.model('Giftcard'),
    SessionService = require('../services/sessions.js'),
    User = mongoose.model('User');

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
            //use populate to return only a users name
            .populate('fromId', 'name') // only return the Persons name
            .populate('toId', 'name') // only return the Persons name
            .exec(function(err, giftcards) {
                if(err){
                    return res.json({msg: "Couldn't search the database for session!",
                            errorid: "779"});
                } else {

                    //We have found our giftcards, now create a multi-dimensional array to
                    //pass back both the giftcards and the names of their users

                    //Create our users object array
                    var users;

                    //Fill our users with a loop through the giftcards
                    for(var i = 0; i < giftcards.length; ++i) {
                        //Create the user object, and place it in the users array
                        users[i] = {
                            sender : giftcards[i].fromId.name,
                            recipient: giftcards[i].toId.name
                        };
                    }

                    //add the users and giftcards to a two dimensional array
                    var resArray = [
                        giftcards,
                        users
                    ];

                    res.json(resArray);
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
