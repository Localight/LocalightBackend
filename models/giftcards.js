'use strict';
/**
 * Module Dependencies
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * GiftCard Schema
 */
var Giftcard = new Schema({
   amount: {
      type:Number,
      min: 0,
      max: 50000,
      require: 'Please enter an amount to purchase between 0 and 50000'
   },
   message:{
      type:String
      //TODO: create limit for how long text can be.
   },
   //IconID
   districtCode: {
      type: String,
      default: 'dont know what to do with this yet',
   },
   stripeOrderId: {
      type: String,
      match: [/ch_[\w\d._%+-]+/, 'This value entered for the stripeId does not match ({VALUE})'],
      //TODO: write regular expresion to match "ch_"[0-2](spaces) for the stripe id.
      required: 'Please provide the stripeOrderId in the correct format.'
   }, // I should only get one stripeOrderId once
   fromId: {
      type: Schema.ObjectId,
      ref: 'User',
      required: 'Please, enter the user id to send this giftcard too.'
   },
   toId: {
      type: Schema.ObjectId,
      ref: 'User',
      required: 'Please, enter the user id who is sending the giftcard.'
   },
});

mongoose.model('Giftcard', Giftcard);
