var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    user = mongoose.model('user');

/* User Join */
router.post('/join', function(req, res, next) {
  //Logic goes here
});

/* User Login */
router.post('/login', function(req, res, next) {
  //Logic goes here
});

/* User Join Through Twilio */
router.post('/twilio', function(req, res, next) {
  //Logic goes here
});

/* Reset Password */
router.post('/reset', function(req, res, next) {
  //Logic goes here
});

/* Get a user */
router.get('/:id', function(req, res, next) {
  //Logic goes here
});

/* Update a user */
router.put('/:id', function(req, res, next) {
  //Logic goes here
});

/* Delete a user */
router.delete('/:id', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
