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
      //create a session token and associate it to our user
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
   // Create a way for us to test create of giftcard based on presence of session token or not.
/**
 * Create A gifcard - Test1
 */
it('should be able to save the giftcard successfully,  given correct parameter', function(done){
   agent.post()// TODO: add in url
   .send(credentials)
   .expect(200)
   .end(function(signinErr, signinRes){
      // Handle Sigin Error
      if(signinErr){
         console.log('You had an error Signin in: '+signinErr);
         console.log('You got a successfully logged in:'+signinRes.body);
         done(signinErr);
      }
      // save a new giftcard
      agent.post('/')// need the long rougte for this to work.
      .send(Giftcard)
      .expect(200)
      .end(function(giftcardSaveErr, giftcardSaveRes){
         // Handle giftcard save error
         if(giftcardSaveErr){
            console.log('You had an error saving the giftcard: '+ giftcardSaveErr);
            done(giftcardSaveErr);
         }
         should.not.exist(giftcardSaveErr);
         done();
      });
   });
});
/**
  * Get A gifcard - Test1
  */
 it('should be able to save the giftcard successfully,  given correct parameter', function(done){
    agent.post()// TODO: add in url
   .send(credentials)
   .expect(200)
   .end(function(signinErr, signinRes){
      // Handle Sigin Error
      if(signinErr){
         console.log('You had an error Signin in: '+signinErr);
         console.log('You got a successfully logged in:'+signinRes.body);
         done(signinErr);
      }
      // save a new giftcard
      agent.post('/')// need the long rougte for this to work.
      .send(Giftcard)
      .expect(200)
      .end(function(giftcardSaveErr, giftcardSaveRes){
         // Handle giftcard save error
         if(giftcardSaveErr){
            console.log('You had an error saving the giftcard: '+ giftcardSaveErr);
            done(giftcardSaveErr);
         }
         should.not.exist(giftcardSaveErr);
         done();
      });
   });
 });
/**
  * Update A gifcard - Test1
  */
 it('should be able to save the giftcard successfully,  given correct parameter', function(done){
    agent.post()// TODO: add in url
    .send(credentials)
    .expect(200)
    .end(function(signinErr, signinRes){
       // Handle Sigin Error
       if(signinErr){
          console.log('You had an error Signin in: '+signinErr);
          console.log('You got a successfully logged in:'+signinRes.body);
          done(signinErr);
       }
       // save a new giftcard
       agent.post('/')// need the long rougte for this to work.
       .send(Giftcard)
       .expect(200)
       .end(function(giftcardSaveErr, giftcardSaveRes){
          // Handle giftcard save error
          if(giftcardSaveErr){
             console.log('You had an error saving the giftcard: '+ giftcardSaveErr);
             done(giftcardSaveErr);
          }
          should.not.exist(giftcardSaveErr);
          done();
       });
    });
 });
/**
  * Get A gifcard - Test1
  */
it('should be able to save the giftcard successfully,  given correct parameter', function(done){
   agent.post()// TODO: add in url
   .send(credentials)
   .expect(200)
   .end(function(signinErr, signinRes){
      // Handle Sigin Error
      if(signinErr){
         console.log('You had an error Signin in: '+signinErr);
         console.log('You got a successfully logged in:'+signinRes.body);
         done(signinErr);
      }
      // save a new giftcard
      agent.post('/')// need the long rougte for this to work.
      .send(Giftcard)
      .expect(200)
      .end(function(giftcardSaveErr, giftcardSaveRes){
         // Handle giftcard save error
         if(giftcardSaveErr){
            console.log('You had an error saving the giftcard: '+ giftcardSaveErr);
            done(giftcardSaveErr);
         }
         should.not.exist(giftcardSaveErr);
         done();
      });
   });
});
   afterEach(function(done) {
      User.remove().exec();
      Giftcard.remove().exec();
      done();
   });
});
