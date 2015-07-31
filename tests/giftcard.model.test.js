 'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
   mongoose = require('mongoose'),
   User = mongoose.model('User'),
   Giftcard = mongoose.model('Giftcard');

/**
 * Globals
 */
var user, user2, giftcard;

/**
 * Unit tests
 * These tests enusre that the giftcard is saved properly, and if it has any methods that it excutes those corretly.

 */
describe('Giftcard Model Unit Tests:', function() {
   // WHAT AM I TESTING?
   // I am testing the unit of the giftcard class object and all the things it could be doing.
   beforeEach(function(done) {
      // If I wanted too I could make a call to get a session token
      // THE SETUP
      // 1. create a fake user to use that simulates an actualy user.
      // 2. create a fake giftcard for them to pass around,
      user = new User({
         // create what you need to make a bare minumn user.
         name: 'Ultron',
         email: 'test@tester.com', //TODO: use an actual email address for this user.
         phone: '1234567890',
         password: 'password'
      });

      user2 = new User({
         // create what you need to make a bare minumn user.
         name: 'brian',
         email: 'testUser2@test.com',
         phone: '1112223333',
         password: 'password'
      });

      user2.save();

      user.save(function(){
         giftcard = new Giftcard({
            stripeOrderId: 'ch_34sdfsdf',
            amount: 1000,
            fromId:user._id,
            toId: user2._id,
            message:'a gift for you',
            iconId:'1231231'
         });// end gift card
         done();
      });// end user save
   });// end beforeEach
   // describe('Pre-Save Method', function(){
   // });
   describe('Method Save', function() {
      // when it saves should be able to save with out probelems it means, that the obejct is created, with alll the requirments,
      // specified in the objects model schema. i.e, all the require functions are valid and the informaiton made it to the database.
      // this is the base case that everyhthing works.
      it('should be able to save without problems', function(done) {
         return giftcard.save(done);
      });

      it('should throw an error when trying to save without a number', function(done) {
         giftcard.amount = null;
         return giftcard.save(function(err) {
            should.exist(err);
            done();
         });
      });

      it('should throw an error when trying to save a negative number', function(done) {
         giftcard.amount = -23432;
         return giftcard.save(function(err) {
            should.exist(err);
            done();
         });
      });

      it('should throw an error when trying to save above the max amount', function(done) {
         giftcard.amount = 20000000;
         return giftcard.save(function(err) {
            should.exist(err);
            done();
         });
      });

      it('should throw an error when trying to save anything other than a number.', function(done) {
         giftcard.amount = 'asdfsd';
         return giftcard.save(function(err) {
            should.exist(err);
            done();
         });
      });

      it('should throw an error when trying to save a without a fromId', function(done) {
         giftcard.fromId = '';
         return giftcard.save(function(err) {
            should.exist(err);
            done();
         });
      });

      it('should throw an error when trying to save without a toId', function(done) {
         giftcard.toId = '';
         return giftcard.save(function(err) {
            should.exist(err);
            done();
         });
      });

      it('should throw an error when trying to save without a stripeId', function(done) {
         giftcard.stripeOrderId = '';
         return giftcard.save(function(err) {
            should.exist(err);
            done();
         });
      });

      it('should throw an error when trying to save a stripeID incorrectly, no puncation characters, only numbers and characters, pattern testing: ch_34sdfsdf', function(done) {
         giftcard.stripeOrderId = 'ch_$asdfas';
         return giftcard.save(function(err) {
            should.exist(err);
            done();
         });
      });

      //TODO: create a method or way to make sure the spenderOfGiftCard and purchaserOfGiftCard,
      // are not the same value.
   });

   // describe('Post-Save Method', function(){
   //
   // });
   afterEach(function(done) {
      Giftcard.remove().exec();
      User.remove().exec();

      done();
   });
});
