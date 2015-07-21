var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    location = mongoose.model('location');

/* Create a Location */
router.post('/locations', function(req, res, next) {
  //Logic goes here
});

/* Update a Location */
router.put('/locations', function(req, res, next) {
  //Logic goes here
});

/* Get a Location */
router.get('/locations', function(req, res, next) {
  //Logic goes here
});

/* Delete a Location */
router.delete('/locations', function(req, res, next) {
  //Logic goes here
});

/* Get a Location by id */
router.get('/locations/:id', function(req, res, next) {
  //Logic goes here
});

/* Make a purchase at a location */
router.post('/locations/spend', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
