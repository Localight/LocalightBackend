'use strict';
/**
 *  Module Dependices
 */
var express = require('express'),
    errorHandler = require('../services/errHandler'),
    router = express.Router(),
    mongoose = require('mongoose'),
    GiftCard = mongoose.model('GiftCard');

/* Giftcard routes. */
router.post('/giftcards', function(req, res, next) {
   console.log('This the value of the request'+JSON.stringify(req.body));
   // TODO: need to be sure that we are doign a little
   //
   var giftcard = new GiftCard({
      //NOTE:why does giftcard have reference to a session token?
      sessionToken:req.body.sessionToken,
      message: req.body.message,
      toId: req.body.toId,
      fromId: req.body.fromId,
      stripeOrderId: req.body.stripeOrderId,
   });
   giftcard.save(function(err){
      if(err){
         return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
         });
      } else{
         res.json(giftcard);
      }
   });

  res.send('Respond with giftcard stuff');
});

module.exports = router;
