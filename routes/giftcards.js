var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    config = require('../config/keys.json'),
    client = require('twilio')(config.twilio.accountSid, config.twilio.authToken),
    Giftcard = mongoose.model('Giftcard')
    Session = mongoose.model('Session')
    User = mongoose.model('User');

/* Create a giftcard */
router.post('/', function(req, res, next) {

    //Find a session with the specified session token. Get the account id.
    var accountId;
    Session.findOne({ token : req.body.sessionToken })
    .select('accountId')
    .exec(function(err, session) {
        if(err){
          return res.json({msg: "Couldn't search the database for session!",
                  errorid: "779"});
        } else if(!session){
          return res.json({msg: "Session is not valid!",
                  errorid: "34"});
        } else {
            accountId = session.accountId;

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
                    !req.body.amount ||
                    !req.body.iconId ||
                    !req.body.message){
                        return res.json({msg: "You must provide toId, amount, iconId and message."});
                    }


                    // Set your secret key: remember to change this to your live secret key in production
                    // See your keys here https://dashboard.stripe.com/account/apikeys
                    var stripe = require("stripe")("sk_test_BQokikJOvBiI2HlWgH4olfQ2");

                    // (Assuming you're using express - expressjs.com)
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
                                    res.json(err);
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
  //Logic goes here
});

/* Get a giftcard */
router.get('/:id', function(req, res, next) {
  //Logic goes here
});

/* Update a giftcard */
router.put('/:id', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
