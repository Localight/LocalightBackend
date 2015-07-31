// 'use strict';
//
// var should = require('should'),
//    request = require('supertest'),
//    app = require('../app'),
//    mongoose = require('mongoose'),
//    User = mongoose.model('User'),
//    agent = request.agent(app);
//
// /**
//  * Globals
//  */
//
// var credentials, user, user2;
//
// /**
//  * User routes Tests
//  */
// describe('User-Auth Tests', function() {
//
//    beforeEach(function(done) {
//
//       credentials = {
//          username: '1112223333',
//          password: 'sdfsdfsdfsd'
//       };//end of credentials
//
//       user = new User({
//          firstName: 'Mark',
//          lastName: 'Down',
//          username: credentials.username,
//          password: credentials.password,
//          provider: 'local',
//          stripeCustomerToken: 'cus_6KW9JPW77VzgP4'
//       });
//       user.save(function(){
//          done();
//       });
//    });
//
//    it('should be able to return a user id, given a phoneNumber', function(done) {
//       console.log(credentials);
//       agent.post('/auth/signin')
//          .send(credentials)
//          .expect(200)
//          .end(function(signinErr, signinRes){
//             // Handle signin error
//             if(signinErr){
//                console.log('Error in signin up'+signinErr);
//                done(signinErr);
//             }
//             if(signinRes){
//                console.log(signinErr);
//             }
//             var payload = {
//                mobileNumber:'2223334444'
//             };
//                //firstName:'Carl'
//
//             agent.post('/auth/findOrCreateUser')
//                .send(payload)
//                .expect(200)
//                .end(function(findOrCreateErr, findOrCreateRes){
//                   if(findOrCreateErr){
//                      console.log('error in find or create'+findOrCreateErr);
//                      return done(findOrCreateErr);
//                   }
//                   should.not.exist(findOrCreateErr);
//                   done();
//                });
//          });
//    });
//    afterEach(function(done){
//       User.remove().exec();
//       done();
//    });
// });
//
// /**
//  * User-stripe routes Tests
//  */
//
// // describe('User-Stripe CRUD tests', function() {
// //    // setup a user who already has a valid stripe id and credentials
// //
// //    before(function(done) {
// //       credentials = {
// //          username: '1234567890',
// //          password: 'password'
// //       }; // end credentials
// //
// //       // Create a new user with valid stripe credentials
// //       user = new User({
// //          firstName: 'Clark',
// //          lastName: 'Kent',
// //          email: 'test@test.com',
// //          username: credentials.username,
// //          password: credentials.password,
// //          provider: 'local',
// //          stripeCustomerToken: 'cus_6KW9JPW77VzgP4', // pre-created in stripe db.
// //          stripeCardToken: {
// //             primary: 'card_167r8DBNPqu3SRN2pr9dO9Pk' // pre-created in stripe db.
// //          }
// //       }); // end user
// //       user.save();
// //    }); // end before each block
// //    it('should be able to successfully charge a user if logged in', function(done) {
// //       agent.post('/auth/signin')
// //          .send(credentials)
// //          .expect(200)
// //          .end(function(signinErr, signinRes) {
// //             console.log(signinErr);
// //             console.log(signinRes);
// //             // Handle signin error
// //             if(signinErr) done(signinErr);
// //             // get the user id, we won't be using it though
// //             var userId = user.id;// this is a variable to compare things too.
// //             var amount = 2000;
// //             agent.post('/stripe/charge')
// //             .send(amount)
// //             .expect(200)
// //             .end(function(stripeSaveErr, stripeSaveRes){
// //                (stripeSaveRes.body.status).should.match('succeeded');
// //                // Handle Stripe Save Error
// //                done(stripeSaveErr);
// //             });
// //          }); //end signin function
// //    }); // end test block for charge
//
//    // afterEach(function(done) {
//    //    User.remove().exec();
//    //    done();
//    // }); // end after each block
//
// // }); // end describe block for user stripe tests
