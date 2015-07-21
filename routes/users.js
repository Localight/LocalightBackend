var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    user = mongoose.model('user');

/* Join a user */
router.post('/join', function(req, res, next) {
  //Logic goes here
});

/* login a user */
router.post('/login', function(req, res, next) {
  //Logic goes here
});

/* signup a user through twilio */
router.post('/twilio', function(req, res, next) {
  //Logic goes here
});

/* reset a user */
router.post('/reset', function(req, res, next) {
  //Logic goes here
});

/* Get a user */
router.get('/:id', function(req, res, next) {
  //Logic goes here
});

/* update a user */
router.put('/:id', function(req, res, next) {
  //Logic goes here
});

/* remove a user */
router.delete('/:id', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
