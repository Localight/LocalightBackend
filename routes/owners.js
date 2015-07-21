var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    owner = mongoose.model('owner');

/* Join an Owner */
router.post('/join', function(req, res, next) {
  //Logic goes here
});

/* Login an Owner */
router.post('/login', function(req, res, next) {
  //Logic goes here
});

/* reset an Owner */
router.post('/reset', function(req, res, next) {
  //Logic goes here
});

/* Get an Owner */
router.get('/', function(req, res, next) {
  //Logic goes here
});

/* Update an Owner */
router.put('/', function(req, res, next) {
  //Logic goes here
});

/* Remove an Owner */
router.delete('/', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
