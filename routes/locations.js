var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Location = mongoose.model('Location');

//Allow Cross Origin Support
router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/* Create a Location */
router.post('/', function(req, res, next) {
  //Logic goes here
});

/* Get all Locations */
router.get('/', function(req, res, next) {
  //Logic goes here
});

/* Get a Location by id */
router.get('/:id', function(req, res, next) {
  //Logic goes here
});

/* Update a Location */
router.put('/:id', function(req, res, next) {
  //Logic goes here
});

/* Delete a Location */
router.delete('/:id', function(req, res, next) {
  //Logic goes here
});

/* Make a purchase at a location */
router.post('/:id/spend', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
