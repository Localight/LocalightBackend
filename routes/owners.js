var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    owner = mongoose.model('owner');

/* Join an Owner */
router.post('/owners/join', function(req, res, next) {
  //Logic goes here
});

/* Login an Owner */
router.post('/owners/login', function(req, res, next) {
  //Logic goes here
});

/* reset an Owner */
router.post('/owners/reset', function(req, res, next) {
  //Logic goes here
});

/* Get an Owner */
router.get('/owners', function(req, res, next) {
  //Logic goes here
});

/* Update an Owner */
router.put('/owners', function(req, res, next) {
  //Logic goes here
});

/* Remove an Owner */
router.delete('/owners', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
