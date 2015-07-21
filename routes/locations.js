var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    location = mongoose.model('location');

/* Create a Location */
router.post('/', function(req, res, next) {
  //Logic goes here
});

/* Update a Location */
router.put('/', function(req, res, next) {
  //Logic goes here
});

/* Get a Location */
router.get('/', function(req, res, next) {
  //Logic goes here
});

/* Delete a Location */
router.delete('/', function(req, res, next) {
  //Logic goes here
});

/* Get a Location by id */
router.get('/:id', function(req, res, next) {
  //Logic goes here
});

/* Make a purchase at a location */
router.post('/spend', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
