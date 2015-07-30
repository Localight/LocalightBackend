'use strict';

var should = require('should'),
   request = require('supertest'),
   app = require('../app'), //
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
         From: '1234567890',
         Body: 'Gift',
      };

      credentials2 = {
         From: '1112223333',
         Body: 'password',
      };

      //create a session token and associate it to our user
      user1 = new User({
         name: 'test user',
         email: 'test@test.com',
         phone: credentials.phone,
         password: credentials.password
      });

      user2 = new User({
         name: 'test2 user2',
         email: 'test2@test.com',
         phone: credentials2.phone,
         password: credentials2.password
      });

      giftcard = new Giftcard({
         sessionToken: 'something',
         name: 'bob',
         fromId: user1._id,
         toId: user2._id,
         amount: 39393,
         iconID: '232',
         message: 'a gift for you!',
         stripeCardToken: 'ch_2h234'
      }); // end giftcard

      user2.save();
      user1.save(); // end user1 save
      done();
   }); // end beforeEach
   // Create a way for us to test create of giftcard based on presence of session token or not.

   /**
    * Create A gifcard - Test1
    */
   it('should be able to get a session token given the phone number is correct', function(done) {
      agent.post('/users/twilio')
         .send(credentials)
         .expect(200)
         .end(function(signinErr, signinRes) {
            // Handle Sign-In error

            if (signinErr) {
               console.log('this is the signin error'+signinErr.body);
               done(signinErr);
            }

            if(signinRes){
               console.log('this is the sigin Response'+JSON.stringify(signinRes.body));
               done(signinRes);
            }
            done();
         });
   });

   it('should be able to save the giftcard successfully,  given correct parameter', function(done) {
      agent.post('/giftcards') // TODO: add in url
         .send(credentials)
         .expect(200)
         .end(function(signinErr, signinRes) {
            // Handle Sigin Error
            if (signinErr) {
               console.log('You had an error Signining in: ' + JSON.stringify(signinErr));
               console.log('You got a successfully logged in:' + JSON.stringify(signinRes.body));
               done(signinErr);
            }

            // save a new giftcard
            agent.post('/') // need the long rougte for this to work.
               .send(Giftcard)
               .expect(200)
               .end(function(giftcardSaveErr, giftcardSaveRes) {
                  // Handle giftcard save error
                  if (giftcardSaveErr) {
                     console.log('You had an error saving the giftcard: ' + giftcardSaveErr);
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
   it('should be able to save the giftcard successfully,  given correct parameter', function(done) {
      agent.post('') // TODO: add in url
         .send(credentials)
         .expect(200)
         .end(function(signinErr, signinRes) {
            // Handle Sigin Error
            if (signinErr) {
               console.log('You had an error Signin in: ' + signinErr);
               console.log('You got a successfully logged in:' + signinRes.body);
               done(signinErr);
            }
            // save a new giftcard
            agent.post('/') // need the long rougte for this to work.
               .send(Giftcard)
               .expect(200)
               .end(function(giftcardSaveErr, giftcardSaveRes) {
                  // Handle giftcard save error
                  if (giftcardSaveErr) {
                     console.log('You had an error saving the giftcard: ' + giftcardSaveErr);
                     done(giftcardSaveErr);
                  }
                  should.not.exist(giftcardSaveErr);
                  done();
               });
         });
   });

   // /**
   //   * Update A gifcard - Test1
   //   */
   //  it('should be able to save the giftcard successfully,  given correct parameter', function(done){
   //     agent.post()// TODO: add in url
   //     .send(credentials)
   //     .expect(200)
   //     .end(function(signinErr, signinRes){
   //        // Handle Sigin Error
   //        if(signinErr){
   //           console.log('You had an error Signin in: '+signinErr);
   //           console.log('You got a successfully logged in:'+signinRes.body);
   //           done(signinErr);
   //        }
   //        // save a new giftcard
   //        agent.post('/')// need the long rougte for this to work.
   //        .send(Giftcard)
   //        .expect(200)
   //        .end(function(giftcardSaveErr, giftcardSaveRes){
   //           // Handle giftcard save error
   //           if(giftcardSaveErr){
   //              console.log('You had an error saving the giftcard: '+ giftcardSaveErr);
   //              done(giftcardSaveErr);
   //           }
   //           should.not.exist(giftcardSaveErr);
   //           done();
   //        });
   //     });
   //  });
   // /**
   //   * Get A gifcard - Test1
   //   */
   // it('should be able to save the giftcard successfully,  given correct parameter', function(done){
   //    agent.post()// TODO: add in url
   //    .send(credentials)
   //    .expect(200)
   //    .end(function(signinErr, signinRes){
   //       // Handle Sigin Error
   //       if(signinErr){
   //          console.log('You had an error Signin in: '+signinErr);
   //          console.log('You got a successfully logged in:'+signinRes.body);
   //          done(signinErr);
   //       }
   //       // save a new giftcard
   //       agent.post('/')// need the long rougte for this to work.
   //       .send(Giftcard)
   //       .expect(200)
   //       .end(function(giftcardSaveErr, giftcardSaveRes){
   //          // Handle giftcard save error
   //          if(giftcardSaveErr){
   //             console.log('You had an error saving the giftcard: '+ giftcardSaveErr);
   //             done(giftcardSaveErr);
   //          }
   //          should.not.exist(giftcardSaveErr);
   //          done();
   //       });
   //    });
   // });
   afterEach(function(done) {
      User.remove().exec();
      Giftcard.remove().exec();
      done();
   });
});
