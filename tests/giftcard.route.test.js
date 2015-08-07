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

var textBody, user1, user2, giftcardDump, giftcard, leToken, giftcardUpdate;

/**
 * Gitcard Routes Tests
 */

describe('Giftcard Routes Tests', function() {
   before(function() {

      //create a session token and associate it to our user
      user1 = new User({
         name: 'test user',
         email: 'test@test.com',
         phone: '+11234567890',
         password: 'password'
      });
      user2 = new User({
         name: 'test2 user2',
         email: 'test2@test.com',
         phone: '+11234567890',
         password: 'password'
      });
      textBody = {
         From: user1.phone,
         Body: 'Gift'
      };
      giftcard = new Giftcard({
         fromId: user1._id,
         toId: user2._id,
         amount: 3333,
         iconId: 1232,
         message: 'a gift for you',
         stripeOrderId: 'ch_2343hsd',
      });
      giftcardDump = {
         sessionToken: leToken, // need session token
         name: 'bob',
         phone: '1234567890',
         amount: 39393,
         iconId: '232',
         toId: user2._id,
         message: 'a gift for you!',
         stripeCardToken: 'ch_2h234'
      }; // end giftcard
      giftcardUpdate = {
         sessionToken: leToken,
         iconId: '2342',
         message: 'a new gift for you.'
      };
      user2.save();
      user1.save(); // end user1 save
      giftcard.save();
      // make call to twilio and get session token.

   }); // end beforeEach
   // Create a way for us to test create of giftcard based on presence of session token or not.
   /**
    * Create Gift Card
    */
   it('should be able to save the giftcard successfully,  given correct parameter', function() {
      agent.post('/users/twilio')
         .send(textBody)
         .expect(200)
         .end(function(signinErr, signinRes) {
            // Handle Sign-In error

            var holder = signinRes.text;
            // console.log(holder);
            leToken = holder.substr(56, 96);
            // console.log('the value of the parsed string ' + anotherThing);
            // console.log(giftcard);
            agent.post('/giftcards')
               .send(giftcardDump)
               .expect(201)
               .end(function(giftcardSaveErr, giftcardSaveRes) {
                  // console.log('results of saving' + JSON.stringify(giftcardSaveRes));
                  should.not.exist(giftcardSaveErr);
               });
         });
   });

   /**
    * Get Gift Cards
    */
   it('should be able to give back a list of giftcard, given correct parameter', function() {
      agent.get('/giftcards') // TODO: add in url
         .query({sessionToken:leToken})
         .expect(200)
         .end(function(giftcardGetErr, giftcardGetRes) {
            //NOTE: I need to come back, and fine tune this test.
            should.not.exist(giftcardGetErr);
            // save a new giftcard
         });
   });

   /**
    * Get Gift-Card by Id
    */

   it('should be able to get a giftcard by id', function() {
      agent.get('/giftcards/'+giftcard._id) // TODO: add in url
         .query({sessionToken:leToken})
         .expect(200)
         .end(function(giftcardGetErr, giftcardGetRes) {
            //NOTE: I need to come back, and fine tune this test.
            should.not.exist(giftcardGetErr);
            // save a new giftcard
         });
   });
   after(function() {
      User.remove().exec();
      Giftcard.remove().exec();
   });
});
