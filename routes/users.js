var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    user = mongoose.model('user');

/* Join a user */
router.post('/users/join', function(req, res, next) {
  //Logic goes here
});

/* login a user */
router.post('/users/login', function(req, res, next) {
  //Logic goes here
});

/* signup a user through twilio */
router.post('/users/twilio', function(req, res, next) {
  //Logic goes here
});

/* reset a user */
router.post('/users/reset', function(req, res, next) {
  //Logic goes here
});

/* Get a user */
router.get('/users', function(req, res, next) {
  //Logic goes here
});

/* update a user */
router.put('/users', function(req, res, next) {
  //Logic goes here
});

/* remove a user */
router.delete('/users', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
