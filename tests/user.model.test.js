'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
   mongoose = require('mongoose'),
   User = mongoose.model('User');

/**
 * Globals
 */
var user, user2;

/**
 * Unit tests

 */
describe('User Model Unit Tests:', function() {

   before(function(done) {
      user = new User({
         username:'1234567890',
         password:'password',
         provider:'local',
         stripeCustomerToken:'cus_6KW9JPW77VzgP4'
      });
      user2 = new User({
         username:'1234567890',
         password:'password',
         provider:'local',
         stripeCustomerToken:'cus_6KW9JPW77VzgP4'
      });
      done();
   });

   describe('Method Save', function() {

      it('should begin with no users', function(done) {
         User.find({}, function(err, users) {
            users.should.have.length(0);
            done();
         });
      });

      it('should be able to save without problems', function(done) {
         user.save(done);
         //{
            // if(err){
            //    console.log(err);
            // }
            // done();
         //});
      });

      it('should fail to save an existing user again', function(done) {
         user.save();
         return user2.save(function(err) {
            should.exist(err);
            done();
         });
      });

      // it('should be able to show an error when try to save without first name', function(done) {
      //    user.firstName = '';
      //    return user.save(function(err) {
      //       should.exist(err);
      //       done();
      //    });
      // });

      // it('should be able to show an error when try to save without last name', function(done) {
      //    user.lastName = '';
      //    return user.save(function(err) {
      //       should.exist(err);
      //       done();
      //    });
      // });

      // it('should be able to show an error when try to save without an email', function(done) {
      //    user.email = '';
      //    return user.save(function(err) {
      //       should.exist(err);
      //       done();
      //    });
      // });

      it('should be able to show an error when try to save without a phone number/username', function(done) {
         user.username = '';
         return user.save(function(err) {
            should.exist(err);
            done();
         });
      });

      it('should pass when entering the correct format for the username, pattern: 1234567890', function(done) {
      	user.username = '1234567890';
      	return user.save(function(err) {
      		console.log(err);
      		should.not.exist(err);
      		done();
      	});
      });

      it('should be able to show an error when try to save without a phone number/username with characters', function(done) {
         user.username = 'asdfas';
         return user.save(function(err) {
            should.exist(err);
            done();
         });
      });


      it('should be able to show an error when try to save without a  password', function(done) {
         user.username = '';
         return user.save(function(err) {
            should.exist(err);
            done();
         });
      });

      it('should throw an error if phone number/username is less than ten digits', function(done) {
         user.username = '344564545';
         return user.save(function(err) {
            should.exist(err);
            done();
         });
      });

      it('should throw an error if phone number contains letters or characters', function(done) {
         user.username = 'a4564545';
         return user.save(function(err) {
            should.exist(err);
            done();
         });
      });

      it('should throw an error if stripe customer id token does not match regex pattern', function(done) {
         user.stripeCustomerToken = 'sd_a4sd5fg64g5r4b5';
         return user.save(function(err) {
            should.exist(err);
            done();
         });
      });

      it('should throw an error if stripe card token does not match regex pattern', function(done) {
         user.stripeCardToken = 'ssd_a4sd5fg64g5r4b5';
         return user.save(function(err) {
            should.exist(err);
            done();
         });
      });

      it('should throw an error if stripe account token does not match regex pattern', function(done) {
         user.stripeAccountToken = 'ssd_a4sd5fg64g5r4b5';
         return user.save(function(err) {
            should.exist(err);
            done();
         });
      });

   });

   after(function(done) {
      User.remove().exec();
      done();
   });
});
