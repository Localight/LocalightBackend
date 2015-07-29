'use strict';

var should = require('should'),
   request = require('supertest'),
   app = require('../'), // ../app.js
   mongoose = require('mongoose'),
   User = mongoose.model('User'),
   Giftcard = mongoose.model('Giftcard'),
   agent = request.agent(app);

/**
 * Globals
 */

var credentials, credentials2, user1, user2, giftcard;

/**
 * Gitcard Routes Tests
 */
describe('Giftcard Routes Tests', function() {

   beforeEach(function(done) {
      credentials = {
         phone:'1234567890',
         password:'password',
      };
      credentials2 = {
         phone:'1112223333',
         password:'password',
      };

      user1 = new User({
         name: 'test user',
         email:'test@test.com',
         phone: credentials.phone,
         password:credentials.password
      });
      user2 = new User({
         name: 'test2 user2',
         email:'test2@test.com',
         phone: credentials2.phone,
         password:credentials2.password
      });
      user2.save();
      user1.save(function(){
         giftcard = new Giftcard({
            amount: 39393,
            fromId: user1._id,
            toId: user2._id,
            message:'a gift for you!',
            iconID: '232',
            stripeOrderId:'2h234'
         }); // end giftcard
         done();
      });// end user1 save
   });// end beforeEach

/**
 * Create A gifcard - Test1
 */
it('should be able to save the giftcard successfully,  given correct parameter', function(done){

});
/**
  * Get A gifcard - Test1
  */
 it('should be able to save the giftcard successfully,  given correct parameter', function(done){

 });
/**
  * Update A gifcard - Test1
  */
 it('should be able to save the giftcard successfully,  given correct parameter', function(done){

 });
/**
  * Get A gifcard - Test1
  */
it('should be able to save the giftcard successfully,  given correct parameter', function(done){

});
   afterEach(function(done) {
      User.remove().exec();
      Giftcard.remove().exec();
      done();
   });
});
