var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Owner = mongoose.model('Owner');

//Allow Cross Origin Support
router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/* Owner Join */
router.post('/join', function(req, res, next) {
  //Logic goes here
});

/* Owner Login */
router.post('/login', function(req, res, next) {
  //Logic goes here
});

/* Reset Password */
router.post('/reset', function(req, res, next) {
  //Logic goes here
});

/* Get an Owner */
router.get('/:id', function(req, res, next) {
  //Logic goes here
});

/* Update an Owner */
router.put('/:id', function(req, res, next) {
  //Logic goes here
});

/* Remove an Owner */
router.delete('/:id', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
